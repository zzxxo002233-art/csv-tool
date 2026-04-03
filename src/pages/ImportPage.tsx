import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseCSV } from '../utils/csvParser';
import { importAlbums, addOperationLog } from '../utils/storage';
import { Loading } from '../components/Loading';
import '../styles/global.css';

export const ImportPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    fileName: string;
    albumCount: number;
    duplicates: number;
  } | null>(null);

  const canConfirm = useMemo(() => !!pendingConfirm, [pendingConfirm]);

  const downloadTemplate = () => {
    const header = '专辑id,专辑名称,书名,赛道品类,图片1链接,图片2链接,图片3链接,图片4链接';
    const content = header + '\n';
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '专辑图片抽卡CSV模板.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setMessage({ type: 'error', text: '请选择CSV格式的文件' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setPendingConfirm(null);

    try {
      const albums = await parseCSV(file);
      
      if (albums.length === 0) {
        setMessage({ type: 'error', text: 'CSV文件中没有有效数据' });
        setLoading(false);
        return;
      }

      const { imported, duplicates } = importAlbums(albums);
      
      addOperationLog(
        `导入CSV文件：${file.name}`,
        `成功导入${imported}个专辑，其中${duplicates}个为重复数据（已覆盖未抽卡数据）`
      );

      setMessage({
        type: 'success',
        text: `导入成功，共 ${albums.length} 个专辑待抽卡${duplicates > 0 ? `（${duplicates}个重复数据已覆盖）` : ''}。请点击下方「确认」进入抽卡进度总览。`,
      });

      setPendingConfirm({
        fileName: file.name,
        albumCount: albums.length,
        duplicates,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '导入失败，请检查文件格式';
      setMessage({ type: 'error', text: errorMessage });
      addOperationLog(`导入CSV文件：${file.name}`, `失败：${errorMessage}`);
    } finally {
      setLoading(false);
      // 清空文件输入，允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="card">
          <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px', color: 'var(--dark-gray)' }}>
            数据导入
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '14px' }}>
            请选择包含专辑信息的CSV文件进行导入
          </p>

          {message && (
            <div className={`message message-${message.type}`}>
              {message.text}
            </div>
          )}

          {loading ? (
            <Loading text="正在解析CSV文件..." />
          ) : (
            <div
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '8px',
                padding: '60px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--light-gray)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-color)';
                e.currentTarget.style.backgroundColor = '#F0F9FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.backgroundColor = 'var(--light-gray)';
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
              <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px', color: 'var(--dark-gray)' }}>
                点击选择CSV文件
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                支持最大500MB的CSV文件
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          )}

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={downloadTemplate}>
              下载CSV模板
            </button>
            <button
              className="btn btn-primary"
              disabled={!canConfirm}
              onClick={() => {
                if (!pendingConfirm) return;
                addOperationLog(
                  `导入确认：${pendingConfirm.fileName}`,
                  `确认进入总览（${pendingConfirm.albumCount}个专辑，重复${pendingConfirm.duplicates}个）`
                );
                navigate('/overview');
              }}
            >
              确认
            </button>
          </div>

          <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#F0F9FF', borderRadius: '6px' }}>
            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--dark-gray)' }}>
              CSV文件格式要求：
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
              <div>• 表头<strong>必须</strong>包含「专辑id」；其余列（专辑名称、书名、赛道品类、图片1～4链接）可省略或留空</div>
              <div>• 推荐完整表头顺序：专辑id、专辑名称、书名、赛道品类、图片1链接、图片2链接、图片3链接、图片4链接</div>
              <div>• 文件编码：UTF-8；每行一条专辑数据，仅专辑 id 不能为空</div>
            </div>
          </div>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/overview')}>
              返回总览页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
