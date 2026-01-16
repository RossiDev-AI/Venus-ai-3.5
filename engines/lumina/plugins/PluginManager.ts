
import { Editor } from 'tldraw';
import { toast } from 'sonner';

export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    entry: string;
    permissions: string[];
    author: string;
    description?: string;
}

export interface ActivePlugin {
    manifest: PluginManifest;
    iframe: HTMLIFrameElement;
    port: MessagePort;
    status: 'starting' | 'active' | 'error';
}

export class PluginManager {
    private plugins: Map<string, ActivePlugin> = new Map();
    private editor: Editor | null = null;

    setEditor(editor: Editor) {
        this.editor = editor;
    }

    /**
     * Carrega um plugin via URL remota ou Blob.
     */
    async installPlugin(url: string): Promise<void> {
        try {
            // 1. Buscar Manifesto
            const manifestUrl = url.endsWith('manifest.json') ? url : `${url}/manifest.json`;
            const resp = await fetch(manifestUrl);
            const manifest: PluginManifest = await resp.json();

            if (this.plugins.has(manifest.id)) {
                toast.error(`Plugin ${manifest.name} já está ativo.`);
                return;
            }

            // 2. Criar Sandbox Iframe
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.setAttribute('sandbox', 'allow-scripts');
            // O entry point do plugin
            iframe.src = manifest.entry.startsWith('http') ? manifest.entry : `${url}/${manifest.entry}`;
            
            document.body.appendChild(iframe);

            // 3. Estabelecer Canal de Comunicação
            const channel = new MessageChannel();
            
            iframe.onload = () => {
                iframe.contentWindow?.postMessage({ type: 'LUMINA_INIT', port: channel.port2 }, '*', [channel.port2]);
                console.log(`Plugin ${manifest.id} initialized.`);
            };

            // 4. Registrar Handlers de RPC
            channel.port1.onmessage = (e) => this.handlePluginMessage(manifest.id, e.data);

            this.plugins.set(manifest.id, {
                manifest,
                iframe,
                port: channel.port1,
                status: 'starting'
            });

            toast.success(`Plugin ${manifest.name} instalado.`);
        } catch (e) {
            console.error("Plugin Install Failed:", e);
            toast.error("Falha ao carregar manifesto do plugin.");
        }
    }

    private handlePluginMessage(pluginId: string, message: any) {
        const { type, method, params, requestId } = message;
        if (type !== 'LUMINA_RPC') return;

        const plugin = this.plugins.get(pluginId);
        if (!plugin) return;

        console.debug(`[Plugin:${pluginId}] RPC Call: ${method}`, params);

        // Bridge Logic
        switch (method) {
            case 'canvas.getSelection':
                const selected = this.editor?.getSelectedShapes() || [];
                this.sendResponse(plugin, requestId, { shapes: selected });
                break;
            
            case 'canvas.updateShape':
                if (this.editor && params.id) {
                    this.editor.updateShape(params);
                    this.sendResponse(plugin, requestId, { success: true });
                }
                break;

            case 'ui.toast':
                toast(params.message || "Plugin Notification");
                break;

            default:
                console.warn(`Method ${method} not implemented in SDK Bridge.`);
        }
    }

    private sendResponse(plugin: ActivePlugin, requestId: string, data: any) {
        plugin.port.postMessage({ type: 'LUMINA_RPC_RESPONSE', requestId, data });
    }

    getActivePlugins(): PluginManifest[] {
        return Array.from(this.plugins.values()).map(p => p.manifest);
    }

    uninstallPlugin(id: string) {
        const p = this.plugins.get(id);
        if (p) {
            p.iframe.remove();
            p.port.close();
            this.plugins.delete(id);
            toast.info(`Plugin ${p.manifest.name} removido.`);
        }
    }
}

export const pluginManager = new PluginManager();
