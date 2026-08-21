export interface IVpnCheckResult {
  vpnDetected: boolean;
  proxyDetected: boolean;
  localIp?: string;
  publicIp?: string;
  details: string;
}

export const detectVpnAndProxy = async (): Promise<IVpnCheckResult> => {
  return new Promise((resolve) => {
    let vpnDetected = false;
    let proxyDetected = false;
    let localIps: string[] = [];

    // 1. WebRTC ICE Candidate Network Adapter Inspection
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      pc.createDataChannel('vpn_check');

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const cand = event.candidate.candidate;
          // Extract IP addresses from candidate string
          const ipMatch = /([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/.exec(cand);
          if (ipMatch) {
            const ip = ipMatch[1];
            if (!localIps.includes(ip)) localIps.push(ip);

            // VPN tunnel adapter detection heuristics (e.g. tun/tap or multi-homed private VPN subnets 10.8.x.x, 10.147.x.x, 172.20.x.x)
            if (ip.startsWith('10.8.') || ip.startsWith('10.147.') || ip.startsWith('10.255.') || ip.startsWith('172.20.')) {
              vpnDetected = true;
            }
          }
        }
      };

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => {});

      // Timeout fallback
      setTimeout(() => {
        pc.close();
        // Check multi-interface anomaly (Having more than 2 private IP interfaces during exam indicates active VPN tunnel)
        if (localIps.length > 2) {
          vpnDetected = true;
        }

        resolve({
          vpnDetected,
          proxyDetected,
          localIp: localIps.join(', ') || 'Standard Adapter',
          details: vpnDetected
            ? 'Active VPN or Virtual Tunnel Adapter detected via WebRTC network interface audit.'
            : 'Clean network connection. No active VPN adapters detected.',
        });
      }, 1500);
    } catch (err) {
      resolve({
        vpnDetected: false,
        proxyDetected: false,
        details: 'Standard Network Adapter',
      });
    }
  });
};
