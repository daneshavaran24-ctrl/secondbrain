// Gadget Integration Service
// Handles device management with privacy-first data separation

export interface GadgetDevice {
  id: string;
  name: string;
  type: 'smartwatch' | 'smartglasses' | 'smartnotebook' | 'smartphone' | 'smartring' | 'voicerecorder' | 'dock';
  model: string;
  connected: boolean;
  battery: number;
  lastSync: string;
  capabilities: string[];
  status: 'active' | 'disconnected' | 'syncing' | 'error';
}

export interface GadgetData {
  deviceId: string;
  dataType: string;
  value: any;
  timestamp: string;
  compartment: 'health' | 'vision' | 'notes' | 'activity' | 'meetings';
  encrypted: boolean;
  privacyLevel: 'public' | 'private' | 'confidential';
}

export interface DataCompartment {
  id: string;
  name: string;
  encryptionKey: string;
  isolationLevel: number;
  allowedDevices: string[];
  allowedSections: string[];
  dataRetention: number; // days
}

export interface GadgetSettings {
  deviceId: string;
  sections: {
    health: boolean;
    meetings: boolean;
    tasks: boolean;
    knowledge: boolean;
    notes: boolean;
    notifications: boolean;
  };
  privacySettings: {
    shareData: boolean;
    anonymize: boolean;
    retention: number;
  };
}

class GadgetService {
  private devices: Map<string, GadgetDevice> = new Map();
  private dataStore: Map<string, GadgetData[]> = new Map();
  private compartments: Map<string, DataCompartment> = new Map();
  private settings: Map<string, GadgetSettings> = new Map();

  constructor() {
    this.initializeCompartments();
    this.initializeMockDevices();
  }

  // Device Management
  async discoverDevices(): Promise<GadgetDevice[]> {
    // In production, this would use Bluetooth/WiFi discovery
    const discoveredDevices: GadgetDevice[] = [
      {
        id: 'watch_001',
        name: 'ساعت هوشمند',
        type: 'smartwatch',
        model: 'Apple Watch Series 9',
        connected: false,
        battery: 0,
        lastSync: '',
        capabilities: ['heart_rate', 'activity', 'sleep', 'notifications'],
        status: 'disconnected'
      },
      {
        id: 'glasses_001',
        name: 'عینک هوشمند',
        type: 'smartglasses',
        model: 'Google Glass Enterprise',
        connected: false,
        battery: 0,
        lastSync: '',
        capabilities: ['camera', 'display', 'voice', 'ar_overlay'],
        status: 'disconnected'
      },
      {
        id: 'oura_ring_001',
        name: 'انگشتر هوشمند Oura',
        type: 'smartring',
        model: 'Oura Ring Gen 3',
        connected: false,
        battery: 0,
        lastSync: '',
        capabilities: ['sleep', 'heart_rate', 'hrv', 'temperature', 'activity', 'readiness'],
        status: 'disconnected'
      },
      {
        id: 'plaud_001',
        name: 'Plaud AI',
        type: 'voicerecorder',
        model: 'Plaud Note',
        connected: false,
        battery: 85,
        lastSync: '',
        capabilities: ['audio_recording', 'speech_to_text', 'summary', 'minutes', 'action_items'],
        status: 'disconnected'
      },
      {
        id: 'hi_dock_001',
        name: 'Hi Dock H1',
        type: 'dock',
        model: 'Hi Dock H1',
        connected: false,
        battery: 100,
        lastSync: '',
        capabilities: ['audio_recording', 'usb_hub', 'charging', 'speech_to_text', 'summary'],
        status: 'disconnected'
      }
    ];

    return discoveredDevices;
  }

  async connectDevice(deviceId: string): Promise<boolean> {
    try {
      const device = this.devices.get(deviceId);
      if (!device) return false;

      // Simulate connection process
      device.connected = true;
      device.status = 'syncing';
      device.lastSync = new Date().toISOString();
      
      // Initialize device-specific settings
      await this.initializeDeviceSettings(deviceId);
      
      // Start data synchronization
      await this.startDataSync(deviceId);
      
      device.status = 'active';
      this.devices.set(deviceId, device);
      
      return true;
    } catch (error) {
      console.error(`Failed to connect device ${deviceId}:`, error);
      return false;
    }
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (device) {
      device.connected = false;
      device.status = 'disconnected';
      device.battery = 0;
      this.devices.set(deviceId, device);
      
      // Clean up sensitive data if required
      await this.cleanupDeviceData(deviceId);
    }
  }

  // Data Management with Privacy
  async storeData(data: Omit<GadgetData, 'encrypted'>): Promise<void> {
    const compartment = this.getDataCompartment(data.dataType);
    if (!compartment) {
      throw new Error(`No compartment found for data type: ${data.dataType}`);
    }

    // Apply differential privacy
    const processedData = await this.applyDifferentialPrivacy(data);
    
    // Encrypt data
    const encryptedData: GadgetData = {
      ...processedData,
      value: await this.encryptData(processedData.value, compartment.encryptionKey),
      encrypted: true
    };

    // Store in appropriate compartment
    const compartmentData = this.dataStore.get(compartment.id) || [];
    compartmentData.push(encryptedData);
    this.dataStore.set(compartment.id, compartmentData);

    // Apply data retention policy
    await this.applyRetentionPolicy(compartment.id);
  }

  async getData(
    compartmentId: string, 
    filters?: { deviceId?: string; dateRange?: { start: string; end: string } }
  ): Promise<GadgetData[]> {
    const compartment = this.compartments.get(compartmentId);
    if (!compartment) return [];

    let data = this.dataStore.get(compartmentId) || [];

    // Apply filters
    if (filters?.deviceId) {
      data = data.filter(d => d.deviceId === filters.deviceId);
    }

    if (filters?.dateRange) {
      const start = new Date(filters.dateRange.start);
      const end = new Date(filters.dateRange.end);
      data = data.filter(d => {
        const timestamp = new Date(d.timestamp);
        return timestamp >= start && timestamp <= end;
      });
    }

    // Decrypt data for authorized access
    const decryptedData = await Promise.all(
      data.map(async (item) => ({
        ...item,
        value: await this.decryptData(item.value, compartment.encryptionKey),
        encrypted: false
      }))
    );

    return decryptedData;
  }

  // Settings Management
  async updateDeviceSettings(deviceId: string, newSettings: Partial<GadgetSettings>): Promise<void> {
    const currentSettings = this.settings.get(deviceId);
    if (!currentSettings) return;

    const updatedSettings = {
      ...currentSettings,
      ...newSettings,
      sections: { ...currentSettings.sections, ...newSettings.sections },
      privacySettings: { ...currentSettings.privacySettings, ...newSettings.privacySettings }
    };

    this.settings.set(deviceId, updatedSettings);
    
    // Update compartment permissions
    await this.updateCompartmentPermissions(deviceId, updatedSettings);
  }

  getDeviceSettings(deviceId: string): GadgetSettings | null {
    return this.settings.get(deviceId) || null;
  }

  // Integration with App Sections
  async integrateWithSection(
    sectionId: string, 
    dataTypes: string[]
  ): Promise<{ [dataType: string]: any[] }> {
    const result: { [dataType: string]: any[] } = {};

    for (const dataType of dataTypes) {
      const compartment = this.getDataCompartment(dataType);
      if (!compartment || !compartment.allowedSections.includes(sectionId)) {
        continue;
      }

      const data = await this.getData(compartment.id, {
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
          end: new Date().toISOString()
        }
      });

      result[dataType] = data.map(d => d.value);
    }

    return result;
  }

  // Privacy & Security
  private async applyDifferentialPrivacy(data: Omit<GadgetData, 'encrypted'>): Promise<Omit<GadgetData, 'encrypted'>> {
    // Apply differential privacy with epsilon = 0.5
    if (typeof data.value === 'number') {
      const noise = this.generateLaplaceNoise(0.5);
      return {
        ...data,
        value: data.value + noise
      };
    }

    return data;
  }

  private generateLaplaceNoise(epsilon: number): number {
    // Generate Laplace noise for differential privacy
    const u = Math.random() - 0.5;
    return -(1 / epsilon) * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  private async encryptData(data: any, key: string): Promise<string> {
    // Simple encryption (in production, use proper crypto library)
    return btoa(JSON.stringify(data) + key);
  }

  private async decryptData(encryptedData: string, key: string): Promise<any> {
    try {
      const decrypted = atob(encryptedData);
      const dataString = decrypted.replace(key, '');
      return JSON.parse(dataString);
    } catch {
      return null;
    }
  }

  // Device-specific data collection
  private async startDataSync(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device || !device.connected) return;

    switch (device.type) {
      case 'smartwatch':
        await this.syncSmartwatchData(deviceId);
        break;
      case 'smartglasses':
        await this.syncSmartglassesData(deviceId);
        break;
      case 'smartnotebook':
        await this.syncSmartnotebookData(deviceId);
        break;
      case 'smartring':
        await this.syncSmartRingData(deviceId);
        break;
      case 'voicerecorder':
        await this.syncVoiceRecorderData(deviceId);
        break;
      case 'dock':
        await this.syncDockData(deviceId);
        break;
    }

    // Update last sync time
    device.lastSync = new Date().toISOString();
    this.devices.set(deviceId, device);
  }

  private async syncSmartwatchData(deviceId: string): Promise<void> {
    // Simulate smartwatch data collection
    const heartRateData = {
      deviceId,
      dataType: 'heart_rate',
      value: 72 + Math.floor(Math.random() * 20), // 72-92 BPM
      timestamp: new Date().toISOString(),
      compartment: 'health' as const,
      privacyLevel: 'private' as const
    };

    const activityData = {
      deviceId,
      dataType: 'steps',
      value: Math.floor(Math.random() * 10000), // 0-10000 steps
      timestamp: new Date().toISOString(),
      compartment: 'activity' as const,
      privacyLevel: 'private' as const
    };

    await this.storeData(heartRateData);
    await this.storeData(activityData);
  }

  private async syncSmartglassesData(deviceId: string): Promise<void> {
    // Simulate smart glasses data collection
    const visionData = {
      deviceId,
      dataType: 'meeting_scan',
      value: { text: 'Meeting notes from OCR', confidence: 0.92 },
      timestamp: new Date().toISOString(),
      compartment: 'vision' as const,
      privacyLevel: 'confidential' as const
    };

    await this.storeData(visionData);
  }

  private async syncSmartnotebookData(deviceId: string): Promise<void> {
    // Simulate smart notebook data collection
    const notesData = {
      deviceId,
      dataType: 'handwritten_notes',
      value: { text: 'Handwritten notes via OCR', pages: 3 },
      timestamp: new Date().toISOString(),
      compartment: 'notes' as const,
      privacyLevel: 'private' as const
    };

    await this.storeData(notesData);
  }

  private async syncSmartRingData(deviceId: string): Promise<void> {
    // داده‌های خواب
    const sleepData = {
      deviceId,
      dataType: 'sleep_quality',
      value: { 
        total_sleep: 7.5, 
        deep_sleep: 1.8, 
        rem_sleep: 2.1,
        light_sleep: 3.6,
        sleep_score: 85
      },
      timestamp: new Date().toISOString(),
      compartment: 'health' as const,
      privacyLevel: 'private' as const
    };

    // داده‌های HRV
    const hrvData = {
      deviceId,
      dataType: 'hrv',
      value: 65 + Math.floor(Math.random() * 20),
      timestamp: new Date().toISOString(),
      compartment: 'health' as const,
      privacyLevel: 'private' as const
    };

    // داده‌های readiness
    const readinessData = {
      deviceId,
      dataType: 'readiness',
      value: 75 + Math.floor(Math.random() * 20),
      timestamp: new Date().toISOString(),
      compartment: 'health' as const,
      privacyLevel: 'private' as const
    };

    await this.storeData(sleepData);
    await this.storeData(hrvData);
    await this.storeData(readinessData);
  }

  private async syncVoiceRecorderData(deviceId: string): Promise<void> {
    const meetingData = {
      deviceId,
      dataType: 'meeting_recording',
      value: {
        title: 'جلسه ضبط شده',
        duration: 45,
        has_transcript: true,
        has_summary: true,
        has_minutes: true
      },
      timestamp: new Date().toISOString(),
      compartment: 'meetings' as const,
      privacyLevel: 'private' as const
    };

    await this.storeData(meetingData);
  }

  private async syncDockData(deviceId: string): Promise<void> {
    const recordingData = {
      deviceId,
      dataType: 'dock_recording',
      value: {
        title: 'ضبط از Hi Dock',
        has_audio: true,
        has_transcript: true,
        has_summary: true
      },
      timestamp: new Date().toISOString(),
      compartment: 'meetings' as const,
      privacyLevel: 'private' as const
    };

    await this.storeData(recordingData);
  }

  // Initialization methods
  private initializeCompartments(): void {
    const compartments: DataCompartment[] = [
      {
        id: 'health_compartment',
        name: 'Health Data',
        encryptionKey: 'health_key_' + Date.now(),
        isolationLevel: 95,
        allowedDevices: ['watch_001'],
        allowedSections: ['health', 'meetings'],
        dataRetention: 365
      },
      {
        id: 'vision_compartment',
        name: 'Vision Data',
        encryptionKey: 'vision_key_' + Date.now(),
        isolationLevel: 88,
        allowedDevices: ['glasses_001'],
        allowedSections: ['meetings', 'knowledge'],
        dataRetention: 180
      },
      {
        id: 'notes_compartment',
        name: 'Notes Data',
        encryptionKey: 'notes_key_' + Date.now(),
        isolationLevel: 92,
        allowedDevices: ['notebook_001'],
        allowedSections: ['notes', 'tasks', 'knowledge'],
        dataRetention: 730
      },
      {
        id: 'activity_compartment',
        name: 'Activity Data',
        encryptionKey: 'activity_key_' + Date.now(),
        isolationLevel: 90,
        allowedDevices: ['watch_001'],
        allowedSections: ['health'],
        dataRetention: 90
      },
      {
        id: 'oura_compartment',
        name: 'Oura Ring Data',
        encryptionKey: 'oura_key_' + Date.now(),
        isolationLevel: 96,
        allowedDevices: ['oura_ring_001'],
        allowedSections: ['health'],
        dataRetention: 365
      },
      {
        id: 'plaud_compartment',
        name: 'Plaud AI Data',
        encryptionKey: 'plaud_key_' + Date.now(),
        isolationLevel: 97,
        allowedDevices: ['plaud_001'],
        allowedSections: ['meetings', 'tasks', 'knowledge', 'notes'],
        dataRetention: 730
      },
      {
        id: 'hi_dock_compartment',
        name: 'Hi Dock H1 Data',
        encryptionKey: 'hidock_key_' + Date.now(),
        isolationLevel: 96,
        allowedDevices: ['hi_dock_001'],
        allowedSections: ['meetings', 'tasks', 'knowledge', 'notes'],
        dataRetention: 730
      }
    ];

    compartments.forEach(c => this.compartments.set(c.id, c));
  }

  private initializeMockDevices(): void {
    const mockDevices: GadgetDevice[] = [
      {
        id: 'watch_001',
        name: 'ساعت هوشمند',
        type: 'smartwatch',
        model: 'Apple Watch Series 9',
        connected: true,
        battery: 78,
        lastSync: '1 دقیقه پیش',
        capabilities: ['heart_rate', 'activity', 'sleep'],
        status: 'active'
      },
      {
        id: 'glasses_001',
        name: 'عینک هوشمند',
        type: 'smartglasses',
        model: 'Google Glass Enterprise',
        connected: false,
        battery: 0,
        lastSync: '3 ساعت پیش',
        capabilities: ['camera', 'display', 'voice'],
        status: 'disconnected'
      },
      {
        id: 'notebook_001',
        name: 'دفترچه هوشمند',
        type: 'smartnotebook',
        model: 'Rocketbook Core',
        connected: true,
        battery: 85,
        lastSync: '30 دقیقه پیش',
        capabilities: ['handwriting', 'scan', 'sync'],
        status: 'active'
      },
      {
        id: 'oura_ring_001',
        name: 'انگشتر هوشمند Oura',
        type: 'smartring',
        model: 'Oura Ring Gen 3',
        connected: false,
        battery: 0,
        lastSync: 'هرگز',
        capabilities: ['sleep', 'heart_rate', 'hrv', 'temperature', 'activity', 'readiness'],
        status: 'disconnected'
      },
      {
        id: 'plaud_001',
        name: 'Plaud AI',
        type: 'voicerecorder',
        model: 'Plaud Note',
        connected: false,
        battery: 85,
        lastSync: 'هرگز',
        capabilities: ['audio_recording', 'speech_to_text', 'summary', 'minutes', 'action_items'],
        status: 'disconnected'
      }
    ];

    mockDevices.forEach(device => {
      this.devices.set(device.id, device);
      this.initializeDeviceSettings(device.id);
    });
  }

  private async initializeDeviceSettings(deviceId: string): Promise<void> {
    const defaultSettings: GadgetSettings = {
      deviceId,
      sections: {
        health: false,
        meetings: false,
        tasks: false,
        knowledge: false,
        notes: false,
        notifications: false
      },
      privacySettings: {
        shareData: false,
        anonymize: true,
        retention: 365
      }
    };

    // Set device-specific defaults
    const device = this.devices.get(deviceId);
    if (device) {
      switch (device.type) {
        case 'smartwatch':
          defaultSettings.sections.health = true;
          defaultSettings.sections.notifications = true;
          break;
        case 'smartglasses':
          defaultSettings.sections.meetings = true;
          break;
        case 'smartnotebook':
          defaultSettings.sections.notes = true;
          defaultSettings.sections.tasks = true;
          break;
      }
    }

    this.settings.set(deviceId, defaultSettings);
  }

  private getDataCompartment(dataType: string): DataCompartment | null {
    const mapping = {
      'heart_rate': 'health_compartment',
      'sleep': 'health_compartment',
      'sleep_quality': 'oura_compartment',
      'hrv': 'oura_compartment',
      'readiness': 'oura_compartment',
      'steps': 'activity_compartment',
      'meeting_scan': 'vision_compartment',
      'handwritten_notes': 'notes_compartment'
    };

    const compartmentId = mapping[dataType];
    return compartmentId ? this.compartments.get(compartmentId) || null : null;
  }

  private async updateCompartmentPermissions(deviceId: string, settings: GadgetSettings): Promise<void> {
    // Update which sections each device can access based on settings
    for (const compartment of this.compartments.values()) {
      if (compartment.allowedDevices.includes(deviceId)) {
        compartment.allowedSections = Object.entries(settings.sections)
          .filter(([, enabled]) => enabled)
          .map(([section]) => section);
      }
    }
  }

  private async applyRetentionPolicy(compartmentId: string): Promise<void> {
    const compartment = this.compartments.get(compartmentId);
    if (!compartment) return;

    const data = this.dataStore.get(compartmentId) || [];
    const cutoffDate = new Date(Date.now() - compartment.dataRetention * 24 * 60 * 60 * 1000);
    
    const filteredData = data.filter(d => new Date(d.timestamp) > cutoffDate);
    this.dataStore.set(compartmentId, filteredData);
  }

  private async cleanupDeviceData(deviceId: string): Promise<void> {
    // Remove device data when privacy settings require it
    for (const [compartmentId, data] of this.dataStore.entries()) {
      const filteredData = data.filter(d => d.deviceId !== deviceId);
      this.dataStore.set(compartmentId, filteredData);
    }
  }

  // Public getters
  getConnectedDevices(): GadgetDevice[] {
    return Array.from(this.devices.values()).filter(d => d.connected);
  }

  getAllDevices(): GadgetDevice[] {
    return Array.from(this.devices.values());
  }

  getCompartments(): DataCompartment[] {
    return Array.from(this.compartments.values());
  }

  getDeviceBattery(deviceId: string): number {
    const device = this.devices.get(deviceId);
    return device?.battery || 0;
  }
}

export const gadgetService = new GadgetService();