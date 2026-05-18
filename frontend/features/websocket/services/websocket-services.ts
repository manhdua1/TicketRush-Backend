import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_ENDPOINTS } from "@/lib/api-config";

const WS_URL = API_ENDPOINTS.websocket.url;

function toSockJsUrl(value: string) {
  const url = new URL(value);

  if (url.protocol === "ws:") {
    url.protocol = "http:";
  } else if (url.protocol === "wss:") {
    url.protocol = "https:";
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_WEBSOCKET_URL must use http, https, ws, or wss");
  }

  return url.toString();
}

type SubscriptionListener = {
  destination: string;
  callback: (msg: string) => void;
  subscription?: StompSubscription;
};

class WebSocketService {
  private client: Client | null = null;
  private listeners = new Map<string, SubscriptionListener>();
  private connectListeners = new Set<(isReconnect: boolean) => void>();
  private listenerSeq = 0;
  private hasConnectedBefore = false;

  private ensureClient() {
    if (this.client) return this.client;

    if (!WS_URL) {
      throw new Error("NEXT_PUBLIC_WEBSOCKET_URL is missing");
    }

    const sockJsUrl = toSockJsUrl(WS_URL);

    this.client = new Client({
      webSocketFactory: () => new SockJS(sockJsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        const isReconnect = this.hasConnectedBefore;
        this.hasConnectedBefore = true;
        this.resubscribeAll();
        this.connectListeners.forEach((listener) => listener(isReconnect));
      },
      onStompError: (frame) => {
        console.error("STOMP error", frame.headers.message, frame.body);
      },
      onWebSocketError: (event) => {
        console.error("WebSocket error", event);
      },
    });

    return this.client;
  }

  connect() {
    const client = this.ensureClient();
    if (!client.active) {
      client.activate();
    }
  }

  disconnect() {
    this.client?.deactivate();
  }

  subscribe(destination: string, callback: (msg: string) => void) {
    const id = String(++this.listenerSeq);
    this.listeners.set(id, { destination, callback });

    if (this.client?.connected) {
      this.attachListener(id);
    }

    return () => {
      this.detachListener(id);
    };
  }

  onConnect(listener: (isReconnect: boolean) => void) {
    this.connectListeners.add(listener);
    return () => {
      this.connectListeners.delete(listener);
    };
  }

  publish(destination: string, body: unknown) {
    if (!this.client?.connected) return;

    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }

  private resubscribeAll() {
    this.listeners.forEach((_, id) => this.attachListener(id));
  }

  private attachListener(id: string) {
    const listener = this.listeners.get(id);
    if (!listener || !this.client?.connected) return;

    listener.subscription?.unsubscribe();
    listener.subscription = this.client.subscribe(listener.destination, (message: IMessage) => {
      listener.callback(message.body);
    });
  }

  private detachListener(id: string) {
    const listener = this.listeners.get(id);
    listener?.subscription?.unsubscribe();
    this.listeners.delete(id);

    if (this.listeners.size === 0) {
      this.disconnect();
    }
  }
}

export const websocketService = new WebSocketService();
