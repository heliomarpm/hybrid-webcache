export class MockBroadcastChannel {
	private listeners: ((event: { data: any }) => void)[] = [];
	name: string;

	constructor(name: string) {
		this.name = name;
	}

	postMessage(data: any) {
		this.listeners.forEach(listener => listener({ data }));
	}

	addEventListener(type: string, listener: (event: { data: any }) => void) {
		if (type === 'message') {
			this.listeners.push(listener);
		}
	}

	removeEventListener(type: string, listener: (event: { data: any }) => void) {
		if (type === 'message') {
			this.listeners = this.listeners.filter(l => l !== listener);
		}
	}

	close() {
		this.listeners = [];
	}
}
