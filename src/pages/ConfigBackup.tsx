import { useState, useRef } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { 
  Download, 
  Upload, 
  FileJson, 
  FileCode, 
  Check, 
  AlertTriangle,
  Shield,
  Network,
  Clock,
  ArrowRightLeft,
  Package,
  Eye,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { mockFirewallRules, mockNATRules } from '@/data/mockData';
import { useDemoMode } from '@/contexts/DemoModeContext';

// Mock data for export
const mockAliases = [
  { id: 'alias-1', name: 'LAN_NETWORK', type: 'network', values: ['192.168.1.0/24'], description: 'Internal LAN' },
  { id: 'alias-2', name: 'WEB_SERVERS', type: 'host', values: ['192.168.1.10', '192.168.1.11'], description: 'Web servers' },
  { id: 'alias-3', name: 'WEB_PORTS', type: 'port', values: ['80', '443'], description: 'Web ports' },
];

const mockSchedules = [
  { id: 'sched-1', name: 'business_hours', days: [1,2,3,4,5], startTime: '08:00', endTime: '18:00', enabled: true },
  { id: 'sched-2', name: 'weekends', days: [0,6], startTime: '00:00', endTime: '23:59', enabled: true },
];

interface ExportConfig {
  firewallRules: boolean;
  natRules: boolean;
  aliases: boolean;
  schedules: boolean;
}

interface ImportPreview {
  firewallRules: number;
  natRules: number;
  aliases: number;
  schedules: number;
  version: string;
  exportDate: string;
  valid: boolean;
  errors: string[];
}

const ConfigBackup = () => {
  const { demoMode } = useDemoMode();
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    firewallRules: true,
    natRules: true,
    aliases: true,
    schedules: true,
  });
  const [exportFormat, setExportFormat] = useState<'json' | 'xml'>('json');
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importData, setImportData] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const configSections = [
    { key: 'firewallRules', label: 'Firewall Rules', icon: Shield, count: demoMode ? mockFirewallRules.length : 0, color: 'text-blue-400' },
    { key: 'natRules', label: 'NAT Rules', icon: ArrowRightLeft, count: demoMode ? mockNATRules.length : 0, color: 'text-emerald-400' },
    { key: 'aliases', label: 'Aliases', icon: Network, count: demoMode ? mockAliases.length : 0, color: 'text-amber-400' },
    { key: 'schedules', label: 'Schedules', icon: Clock, count: demoMode ? mockSchedules.length : 0, color: 'text-purple-400' },
  ];

  const selectedCount = Object.values(exportConfig).filter(Boolean).length;

  const generateExportData = () => {
    const data: any = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      hostname: 'AEGIS-NGFW-500',
    };

    if (!demoMode) return data;

    if (exportConfig.firewallRules) {
      data.firewallRules = mockFirewallRules.map(rule => ({
        ...rule,
        created: rule.created.toISOString(),
        lastHit: rule.lastHit?.toISOString(),
      }));
    }
    if (exportConfig.natRules) data.natRules = mockNATRules;
    if (exportConfig.aliases) data.aliases = mockAliases;
    if (exportConfig.schedules) data.schedules = mockSchedules;

    return data;
  };

  const convertToXML = (obj: any, rootName: string = 'config'): string => {
    const convert = (o: any, indent: number = 0): string => {
      const spaces = '  '.repeat(indent);
      let xml = '';

      if (Array.isArray(o)) {
        o.forEach((item, idx) => {
          xml += `${spaces}<item index="${idx}">\n${convert(item, indent + 1)}${spaces}</item>\n`;
        });
      } else if (typeof o === 'object' && o !== null) {
        Object.entries(o).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            xml += `${spaces}<${key}>\n${convert(value, indent + 1)}${spaces}</${key}>\n`;
          } else if (typeof value === 'object' && value !== null) {
            xml += `${spaces}<${key}>\n${convert(value, indent + 1)}${spaces}</${key}>\n`;
          } else {
            xml += `${spaces}<${key}>${value}</${key}>\n`;
          }
        });
      } else {
        xml += `${spaces}${o}\n`;
      }

      return xml;
    };

    return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n${convert(obj, 1)}</${rootName}>`;
  };

  const handleExport = () => {
    const data = generateExportData();
    let content: string;
    let filename: string;
    let mimeType: string;

    if (exportFormat === 'json') {
      content = JSON.stringify(data, null, 2);
      filename = `ngfw-config-${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    } else {
      content = convertToXML(data, 'ngfw-config');
      filename = `ngfw-config-${new Date().toISOString().split('T')[0]}.xml`;
      mimeType = 'application/xml';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Configuration exported as ${filename}`);
  };

  const handlePreview = () => {
    const data = generateExportData();
    let content: string;

    if (exportFormat === 'json') {
      content = JSON.stringify(data, null, 2);
    } else {
      content = convertToXML(data, 'ngfw-config');
    }

    setPreviewContent(content);
    setPreviewOpen(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let data: any;

        if (file.name.endsWith('.json')) {
          data = JSON.parse(content);
        } else if (file.name.endsWith('.xml')) {
          // Simple XML parsing for demo - in production use a proper XML parser
          toast.error('XML import not yet implemented. Please use JSON format.');
          return;
        } else {
          toast.error('Unsupported file format. Use .json or .xml');
          return;
        }

        // Validate and preview
        const preview: ImportPreview = {
          firewallRules: data.firewallRules?.length || 0,
          natRules: data.natRules?.length || 0,
          aliases: data.aliases?.length || 0,
          schedules: data.schedules?.length || 0,
          version: data.version || 'unknown',
          exportDate: data.exportDate || 'unknown',
          valid: true,
          errors: [],
        };

        // Basic validation
        if (!data.version) {
          preview.errors.push('Missing version field');
          preview.valid = false;
        }

        if (preview.firewallRules === 0 && preview.natRules === 0 && 
            preview.aliases === 0 && preview.schedules === 0) {
          preview.errors.push('No configuration data found');
          preview.valid = false;
        }

        setImportPreview(preview);
        setImportData(data);
        setImporting(true);
      } catch (err) {
        toast.error('Failed to parse file. Please check the format.');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = () => {
    if (!importData) return;

    // In a real app, this would update the actual state/database
    const imported = [];
    if (importData.firewallRules?.length) imported.push(`${importData.firewallRules.length} firewall rules`);
    if (importData.natRules?.length) imported.push(`${importData.natRules.length} NAT rules`);
    if (importData.aliases?.length) imported.push(`${importData.aliases.length} aliases`);
    if (importData.schedules?.length) imported.push(`${importData.schedules.length} schedules`);

    toast.success(`Imported: ${imported.join(', ')}`);
    setImporting(false);
    setImportPreview(null);
    setImportData(null);
  };

  const cancelImport = () => {
    setImporting(false);
    setImportPreview(null);
    setImportData(null);
  };

  return (
    <Shell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold">Configuration Backup</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Export and import firewall configuration</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Export Section */}
          <div className="section p-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10">
                <Download size={20} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold">Export Configuration</h2>
                <p className="text-xs text-muted-foreground">Download current settings as backup</p>
              </div>
            </div>

            {/* Config Sections */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground mb-2">Select data to export:</div>
              {configSections.map((section) => (
                <div
                  key={section.key}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                    exportConfig[section.key as keyof ExportConfig]
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/50 bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <section.icon size={16} className={section.color} />
                    <div>
                      <div className="text-sm font-medium">{section.label}</div>
                      <div className="text-[10px] text-muted-foreground">{section.count} items</div>
                    </div>
                  </div>
                  <Switch
                    checked={exportConfig[section.key as keyof ExportConfig]}
                    onCheckedChange={(checked) => 
                      setExportConfig(prev => ({ ...prev, [section.key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Export format:</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setExportFormat('json')}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border transition-colors",
                    exportFormat === 'json'
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:bg-muted/50"
                  )}
                >
                  <FileJson size={18} className={exportFormat === 'json' ? "text-primary" : "text-muted-foreground"} />
                  <div className="text-left">
                    <div className="text-sm font-medium">JSON</div>
                    <div className="text-[10px] text-muted-foreground">Recommended</div>
                  </div>
                </button>
                <button
                  onClick={() => setExportFormat('xml')}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border transition-colors",
                    exportFormat === 'xml'
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:bg-muted/50"
                  )}
                >
                  <FileCode size={18} className={exportFormat === 'xml' ? "text-primary" : "text-muted-foreground"} />
                  <div className="text-left">
                    <div className="text-sm font-medium">XML</div>
                    <div className="text-[10px] text-muted-foreground">Legacy support</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Export Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={selectedCount === 0}
                className="gap-1.5"
              >
                <Eye size={14} />
                Preview
              </Button>
              <Button
                size="sm"
                onClick={handleExport}
                disabled={selectedCount === 0}
                className="gap-1.5 flex-1"
              >
                <Download size={14} />
                Export {selectedCount} Section{selectedCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>

          {/* Import Section */}
          <div className="section p-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10">
                <Upload size={20} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold">Import Configuration</h2>
                <p className="text-xs text-muted-foreground">Restore settings from backup file</p>
              </div>
            </div>

            {!importing ? (
              <>
                {/* Drop Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  <Package size={32} className="mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Click to select or drag & drop
                  </p>
                  <p className="text-[10px] text-muted-foreground/70">
                    Supports .json and .xml files
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Import Warning */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-200/80">
                    <strong>Warning:</strong> Importing will merge with existing configuration. 
                    Duplicate items may be overwritten.
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Import Preview */}
                {importPreview && (
                  <div className="space-y-3">
                    <div className={cn(
                      "flex items-center gap-2 p-3 rounded-lg",
                      importPreview.valid 
                        ? "bg-emerald-500/10 border border-emerald-500/20" 
                        : "bg-red-500/10 border border-red-500/20"
                    )}>
                      {importPreview.valid ? (
                        <Check size={16} className="text-emerald-400" />
                      ) : (
                        <AlertTriangle size={16} className="text-red-400" />
                      )}
                      <span className={cn(
                        "text-xs",
                        importPreview.valid ? "text-emerald-200" : "text-red-200"
                      )}>
                        {importPreview.valid ? 'File validated successfully' : 'Validation errors found'}
                      </span>
                    </div>

                    {importPreview.errors.length > 0 && (
                      <div className="p-3 rounded-lg bg-red-500/10 text-xs text-red-200 space-y-1">
                        {importPreview.errors.map((error, idx) => (
                          <div key={idx}>• {error}</div>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Version: <span className="font-mono">{importPreview.version}</span> | 
                      Exported: {new Date(importPreview.exportDate).toLocaleString()}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {configSections.map((section) => {
                        const count = importPreview[section.key as keyof ImportPreview] as number;
                        return (
                          <div
                            key={section.key}
                            className={cn(
                              "flex items-center gap-2 p-2.5 rounded-lg",
                              count > 0 ? "bg-muted/50" : "bg-muted/20 opacity-50"
                            )}
                          >
                            <section.icon size={14} className={section.color} />
                            <span className="text-xs">{section.label}</span>
                            <span className="ml-auto text-xs font-mono text-muted-foreground">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelImport}
                        className="gap-1.5"
                      >
                        <X size={14} />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleImport}
                        disabled={!importPreview.valid}
                        className="gap-1.5 flex-1"
                      >
                        <Upload size={14} />
                        Import Configuration
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Recent Backups (mock) */}
        <div className="section p-4">
          <h3 className="text-sm font-medium mb-3">Recent Exports</h3>
          <div className="space-y-2">
            {[
              { name: 'ngfw-config-2024-01-25.json', date: '2024-01-25 14:30', size: '24 KB' },
              { name: 'ngfw-config-2024-01-20.json', date: '2024-01-20 09:15', size: '22 KB' },
              { name: 'ngfw-config-2024-01-15.xml', date: '2024-01-15 16:45', size: '28 KB' },
            ].map((backup, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  {backup.name.endsWith('.json') ? (
                    <FileJson size={16} className="text-amber-400" />
                  ) : (
                    <FileCode size={16} className="text-blue-400" />
                  )}
                  <div>
                    <div className="text-sm font-mono">{backup.name}</div>
                    <div className="text-[10px] text-muted-foreground">{backup.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{backup.size}</span>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    <Download size={12} className="mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {exportFormat === 'json' ? <FileJson size={18} /> : <FileCode size={18} />}
              Export Preview
            </DialogTitle>
            <DialogDescription>
              Preview of the configuration that will be exported
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[60vh] bg-muted/30 rounded-lg p-4">
            <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
              {previewContent}
            </pre>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={() => { setPreviewOpen(false); handleExport(); }}>
              <Download size={14} className="mr-1.5" />
              Export
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
};

export default ConfigBackup;
