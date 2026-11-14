export default function init(): Promise<unknown>;

export function minecraft_versions(): Promise<string[]>;

export class VanillaAssets {
	readonly version: string;
	readonly files: number;
	readonly downloaded: number;
	free(): void;
}

export function load_vanilla(version: string, progress: (message: string) => void): Promise<VanillaAssets>;

export class App {
	constructor(canvas: HTMLCanvasElement);
	destroy(): Promise<void>;
	set_vanilla(assets: VanillaAssets): Promise<string | null>;
	load_preview(bytes: Uint8Array): Promise<string | null>;
	load_schematic(bytes: Uint8Array): Promise<string | null>;
	set_progress(callback: ((fraction: number) => void) | undefined): void;
	readonly layer_count: number;
	set_layer(layer: number | undefined): void;
	set_time(time: string): void;
	free(): void;
}
