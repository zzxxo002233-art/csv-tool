// 专辑数据接口
export interface Album {
  albumId: string;
  albumName: string;
  bookName: string;
  category: string;
  image1: string;
  image2: string;
  image3: string;
  image4: string;
}

// 抽卡结果接口
export interface ReviewResult {
  albumId: string;
  albumName: string;
  bookName: string;
  category: string;
  imageLink: string;
  reviewStatus: '已抽卡' | '未抽卡';
}

// 专辑抽卡状态
export interface AlbumReviewStatus {
  albumId: string;
  albumName: string;
  bookName: string;
  category: string;
  reviewProgress: number; // 0-4
  reviewStatus: '已抽卡' | '未抽卡';
  selectedImageIndex?: number; // 选中的图片索引 1-4
  selectedImageLink?: string; // 选中的图片链接
}

// 专辑元数据（用于展示与筛选）
export interface AlbumMeta {
  albumId: string;
  importedAt: string; // ISO字符串
}

// 操作日志
export interface OperationLog {
  id: string;
  operator: string;
  operationTime: string;
  operation: string;
  result: string;
}

// CSV 表头：导入时仅「专辑id」必填；其余列可出现在表头中，缺失则按空值处理
export const CSV_REQUIRED_HEADER = '专辑id' as const;

export const CSV_HEADERS = [
  '专辑id',
  '专辑名称',
  '书名',
  '赛道品类',
  '图片1链接',
  '图片2链接',
  '图片3链接',
  '图片4链接'
] as const;
