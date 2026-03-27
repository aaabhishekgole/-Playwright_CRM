export const supportedRepairCategories = [
  {
    id: 'MOBILE',
    label: 'Mobile',
    identifier: 'IMEI + serial',
    detail: 'Smartphones and handheld devices with IMEI-led intake and repair tracking.',
  },
  {
    id: 'TV',
    label: 'TV',
    identifier: 'Serial number',
    detail: 'LED, OLED, and smart TV repairs with panel, board, and power diagnostics.',
  },
  {
    id: 'LAPTOP',
    label: 'Laptop',
    identifier: 'Serial number',
    detail: 'Portable systems covering display, motherboard, battery, and keyboard repairs.',
  },
  {
    id: 'AC',
    label: 'AC',
    identifier: 'Serial number',
    detail: 'Air-conditioner intake for cooling, compressor, PCB, and service maintenance work.',
  },
  {
    id: 'CAMERA_DSLR',
    label: 'Camera / DSLR',
    identifier: 'Serial number',
    detail: 'Camera body, lens-mount, sensor, shutter, and DSLR repair workflows.',
  },
] as const;

export function formatDeviceCategory(category?: string | null) {
  switch (category) {
    case 'MOBILE':
      return 'Mobile';
    case 'TV':
      return 'TV';
    case 'LAPTOP':
      return 'Laptop';
    case 'AC':
      return 'AC';
    case 'CAMERA_DSLR':
      return 'Camera / DSLR';
    default:
      return category?.replaceAll('_', ' ') ?? 'Mobile';
  }
}

export function usesImei(category?: string | null) {
  return (category ?? 'MOBILE') === 'MOBILE';
}
