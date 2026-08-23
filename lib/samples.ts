// ── Loadable sample inputs (product-data domain) ──────────────────────────────

export interface Sample {
  id: string;
  label: string;
  icon: string;
  title: string;
  text: string;
}

export const SAMPLES: Sample[] = [
  {
    id: "ups",
    label: "Electronics spec sheet",
    icon: "🔌",
    title: "PowerLine UPS 850VA — Spec Sheet",
    text: `PowerLine UPS 850VA / 480W — Line-Interactive UPS

Product: PowerGuard 850. Input voltage: 230V AC (162–290V range). Output voltage: 230V AC ± 5%. Frequency: 50Hz ± 1Hz. Waveform: simulated sine wave. Battery: 12V 7Ah sealed lead-acid, 2 units. Backup time: 18–25 minutes at half load. Recharge time: 6 hours to 90%.
Transfer time: < 6 ms. Outlets: 4 surge-protected + 4 battery-backed IEC sockets. USB port for monitoring. Alarm: buzzer for low battery and overload. Display: LED indicators (mains, battery, fault).
Physical: 335 × 105 × 172 mm, 6.4 kg. Operating temperature 0–40 °C, humidity 20–90% non-condensing. Noise < 40 dB. Protection: overload 110% for 30s, short-circuit and lightning surge up to 320 joules. Warranty: 2 years on-site.

Use: home offices, desktop PCs, NAS devices, routers and modems during power cuts.

Second model — PowerGuard 1500: 1500VA / 900W. Input 230V AC. Output 230V pure sine wave. Battery 2 × 12V 9Ah. Backup 25–40 min at half load. 6 outlets. LCD display. USB + serial ports. Rack/tower convertible. 415 × 190 × 145 mm, 14.8 kg. Warranty 3 years. For servers, workstations, network racks and medical lab equipment.`,
  },
  {
    id: "sensor",
    label: "Industrial datasheet",
    icon: "🏭",
    title: "SITRANS P320 Pressure Transmitter",
    text: `Siemens SITRANS P320 — Pressure Transmitter, datasheet extract.

Measuring range: 0 to 100 bar (adjustable). Accuracy: 0.065% of span. Output signal: 4–20 mA with HART 7 protocol. Power supply: 10.5 to 45 V DC. Load: max 700 Ω. Response time: 60 ms.

Process connection: G½ A / ½ NPT, stainless steel 316L diaphragm. Ambient temperature: -40 to +85 °C. Process temperature: -40 to +125 °C (with cooling element to 200 °C). Turn-down ratio: 100:1. Protection class: IP67. Display: 4-digit backlit LCD with local buttons. Certifications: ATEX, IECEx, FM.

Communication: HART 7, PROFIBUS PA optional. Housing: aluminium die-cast or 316L stainless. Weight 0.9 kg. Warranty 5 years.

Typical use: process industries, oil & gas pipelines, water treatment, pharmaceutical clean-in-place monitoring, steam pressure control in boilers.`,
  },
  {
    id: "catalog",
    label: "Product catalog rows",
    icon: "📋",
    title: "Abrasives Catalog Extract",
    text: `Mfg_Part_Num | Part_Desc | E1_Brand | Part_Manuf

DCB518ASTS06G Diablo 1/2"x18" Sanding Belt 6pc -- Unbranded -- Freud Inc (2435)
3MABR-7100075678 3M 775L Stikit Film P150 Cubitron II 50 Disc/Box -- Unbranded -- Jam Industrial Supply LLC (JAMIN)
3MABR-7100045865 3M 775L Stikit Film P120 Cubitron II 50 Disc/Box -- Unbranded -- Jam Industrial Supply LLC (JAMIN)
3MABR-7100048736 3M 775L Stikit Film P80 Cubitron II 50 Disc/Box -- Unbranded -- Jam Industrial Supply LLC (JAMIN)
DCB3021806G Diablo 3"x18" Sanding Belt 60grit -- Unbranded -- Freud Inc (2435)
DCB3118100F Diablo 3"x18" File Belt 100grit -- Unbranded -- Freud Inc (2435)
UDD4510120N Unbranded 4.5" Diamond Cup Wheel Type 27 -- Unbranded -- Jam Industrial Supply LLC (JAMIN)
MM64100080N Mercato Mibile 40G Disc 5" 8-hole -- Mercato -- Nord Composites SPA (NORD)
MM65100120N Mercato Mibile 120G Disc 5" 8-hole -- Mercato -- Nord Composites SPA (NORD)
KMG1122505G Kreg 2.25" Mixed Grit Sanding Disc 5pc -- Kreg -- Peak Toolworks LLC (PEAK)`,
  },
];
