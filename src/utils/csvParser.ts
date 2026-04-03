import { Album, CSV_REQUIRED_HEADER } from '../types';

/**
 * 解析CSV文件
 */
export function parseCSV(file: File): Promise<Album[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          reject(new Error('CSV文件至少需要包含表头和数据行'));
          return;
        }
        
        // 解析表头：去 BOM、去首尾空格，避免 Excel/记事本导出后「图片4链接」列对不上
        const headerLine = lines[0].replace(/^\uFEFF/, '');
        const headers = parseCSVLine(headerLine).map((h) => h.replace(/^\uFEFF/, '').trim());

        // 表头：仅要求包含「专辑id」，其余列选填（可省略整列）
        if (!headers.includes(CSV_REQUIRED_HEADER)) {
          reject(new Error(`缺少必需字段：${CSV_REQUIRED_HEADER}`));
          return;
        }

        /** 按列名取值，支持常见别名（如「图片4」） */
        const cell = (values: string[], colName: string, ...aliases: string[]): string => {
          const names = [colName, ...aliases];
          for (const name of names) {
            const idx = headers.indexOf(name);
            if (idx !== -1 && idx < values.length) {
              return (values[idx] ?? '').trim();
            }
          }
          return '';
        };

        const normalizeRowValues = (values: string[]): string[] => {
          const row = [...values];
          while (row.length < headers.length) row.push('');
          if (row.length > headers.length) return row.slice(0, headers.length);
          return row;
        };

        // 解析数据行
        const albums: Album[] = [];
        for (let i = 1; i < lines.length; i++) {
          const rawValues = parseCSVLine(lines[i]);
          const values = normalizeRowValues(rawValues);

          const album: Album = {
            albumId: cell(values, '专辑id'),
            albumName: cell(values, '专辑名称'),
            bookName: cell(values, '书名'),
            category: cell(values, '赛道品类'),
            image1: cell(values, '图片1链接', '图片1'),
            image2: cell(values, '图片2链接', '图片2'),
            image3: cell(values, '图片3链接', '图片3'),
            image4: cell(values, '图片4链接', '图片4'),
          };

          // 仅专辑 id 必填
          if (!album.albumId) {
            reject(new Error(`第${i + 1}行：专辑id不能为空`));
            return;
          }

          albums.push(album);
        }
        
        resolve(albums);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('CSV解析失败'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * 解析CSV行（处理引号和逗号）
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // 转义的双引号
        current += '"';
        i++;
      } else {
        // 切换引号状态
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // 字段分隔符
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // 添加最后一个字段
  values.push(current);
  
  return values;
}

/**
 * 导出CSV文件
 */
export function exportCSV(data: Array<Record<string, string>>, filename: string) {
  if (data.length === 0) {
    throw new Error('没有数据可导出');
  }
  
  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];
  
  // 添加表头
  csvRows.push(headers.map(h => escapeCSVField(h)).join(','));
  
  // 添加数据行
  data.forEach(row => {
    const values = headers.map(header => escapeCSVField(row[header] || ''));
    csvRows.push(values.join(','));
  });
  
  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * 转义CSV字段
 */
function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
