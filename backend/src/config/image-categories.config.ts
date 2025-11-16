export interface ImageCategoryConfig {
  key: string;
  name: string;
  localPath: string;
}

export const imageCategories: ImageCategoryConfig[] = [
  { key: 'economy', name: 'Ekonomihantering', localPath: '' },
  { key: 'contracts', name: 'Avtal & Abonnemang', localPath: '' },
  { key: 'car', name: 'Bilkostnader', localPath: '' },
  { key: 'inventory', name: 'Inventering', localPath: '' },
  { key: 'warranty', name: 'Garantier & Försäkringar', localPath: '' },
];
