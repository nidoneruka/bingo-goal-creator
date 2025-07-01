import React, { useState, useRef, useEffect } from 'react';
import { Download, Save } from 'lucide-react';

const BingoGoalCreator = () => {
  const [goals, setGoals] = useState(Array(25).fill(''));
  const [title, setTitle] = useState('私の目標ビンゴ');
  const [completedCells, setCompletedCells] = useState(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saving', 'saved'
  const canvasRef = useRef(null);

  // ローカルストレージのキー
  const STORAGE_KEY = 'bingo-goal-data';

  const colorTheme = {
    primary: '#3B82F6',
    secondary: '#EFF6FF',
    accent: '#1E40AF',
    text: '#1F2937'
  };

  // 初期化時にローカルストレージから読み込み
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setGoals(parsed.goals || Array(25).fill(''));
        setTitle(parsed.title || '私の目標ビンゴ');
        setCompletedCells(new Set(parsed.completedCells || []));
      } catch (error) {
        console.error('保存データの読み込みに失敗:', error);
      }
    }
  }, []);

  // データが変更されたら自動保存
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      const dataToSave = {
        goals,
        title,
        completedCells: Array.from(completedCells),
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      setSaveStatus('saved');
    }, 500); // 500ms後に保存

    return () => clearTimeout(timer);
  }, [goals, title, completedCells]);

  const handleGoalChange = (index, value) => {
    const newGoals = [...goals];
    newGoals[index] = value;
    setGoals(newGoals);
  };

  const toggleComplete = (index) => {
    const newCompleted = new Set(completedCells);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedCells(newCompleted);
  };

  // 手動保存
  const handleManualSave = () => {
    setSaveStatus('saving');
    const dataToSave = {
      goals,
      title,
      completedCells: Array.from(completedCells),
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    
    setTimeout(() => {
      setSaveStatus('saved');
    }, 300);
  };

  const generateImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // A4サイズ対応の高解像度設定 (300 DPI)
    const width = 2480;
    const height = 3508;
    canvas.width = width;
    canvas.height = height;

    // 背景色
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // マージン設定
    const margin = 200;
    const contentWidth = width - margin * 2;
    const contentHeight = height - margin * 2;

    // タイトル描画
    ctx.fillStyle = colorTheme.primary;
    ctx.font = 'bold 120px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, width / 2, margin + 150);

    // ビンゴグリッドの設定
    const gridStartY = margin + 300;
    const gridHeight = contentHeight - 300;
    const cellSize = Math.min(contentWidth / 5, gridHeight / 5);
    const gridWidth = cellSize * 5;
    const gridStartX = (width - gridWidth) / 2;

    // グリッド描画
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const index = row * 5 + col;
        const x = gridStartX + col * cellSize;
        const y = gridStartY + row * cellSize;

        // セルの背景
        if (completedCells.has(index)) {
          ctx.fillStyle = colorTheme.primary;
        } else {
          ctx.fillStyle = colorTheme.secondary;
        }
        ctx.fillRect(x, y, cellSize, cellSize);

        // セルの枠線
        ctx.strokeStyle = colorTheme.accent;
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, cellSize, cellSize);

        // テキスト描画
        const text = goals[index] || '';
        if (text) {
          ctx.fillStyle = completedCells.has(index) ? '#ffffff' : colorTheme.text;
          ctx.font = 'bold 48px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // 長いテキストの場合は改行
          const maxWidth = cellSize - 80;
          const lines = wrapText(ctx, text, maxWidth, 48);
          const lineHeight = 55;
          const totalHeight = lines.length * lineHeight;
          const startY = y + cellSize / 2 - totalHeight / 2 + lineHeight / 2;
          
          lines.forEach((line, i) => {
            ctx.fillText(line, x + cellSize / 2, startY + i * lineHeight);
          });
        }

        // 完了マーク（右上に小さく）
        if (completedCells.has(index)) {
          const checkMarkSize = cellSize * 0.08;
          const checkX = x + cellSize - checkMarkSize - 20;
          const checkY = y + 20;
          
          // 小さい円形背景
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(checkX + checkMarkSize/2, checkY + checkMarkSize/2, checkMarkSize/2 + 5, 0, 2 * Math.PI);
          ctx.fill();
          
          // チェックマーク
          ctx.strokeStyle = colorTheme.primary;
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          
          const checkCenterX = checkX + checkMarkSize/2;
          const checkCenterY = checkY + checkMarkSize/2;
          const checkSize = checkMarkSize * 0.4;
          
          ctx.moveTo(checkCenterX - checkSize/2, checkCenterY);
          ctx.lineTo(checkCenterX - checkSize/6, checkCenterY + checkSize/2);
          ctx.lineTo(checkCenterX + checkSize/2, checkCenterY - checkSize/2);
          ctx.stroke();
        }
      }
    }

    // 高画質PNG画像を生成
    const dataURL = canvas.toDataURL('image/png', 1.0);
    setPreviewImage(dataURL);
    setShowPreview(true);
  };

  // テキスト折り返し関数
  const wrapText = (ctx, text, maxWidth, fontSize = 48) => {
    const words = text.split('');
    const lines = [];
    let currentLine = '';

    ctx.font = `bold ${fontSize}px Arial, sans-serif`;

    for (let word of words) {
      const testLine = currentLine + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium"
              placeholder="ビンゴのタイトル"
            />

            <div className="flex gap-3">
              <button
                onClick={handleManualSave}
                disabled={saveStatus === 'saving'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  saveStatus === 'saving'
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : saveStatus === 'saved'
                    ? 'bg-green-500 text-white cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <Save className="w-4 h-4" />
                {saveStatus === 'saving' ? '自動保存中' : '保存完了'}
              </button>

              <button
                onClick={generateImage}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                画像を生成
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* ビンゴグリッド */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-4" style={{ color: colorTheme.primary }}>
              {title}
            </h2>
            
            <div className="grid grid-cols-5 gap-2 aspect-square">
              {goals.map((goal, index) => (
                <div
                  key={index}
                  className={`relative border-2 rounded-lg p-2 transition-all ${
                    completedCells.has(index)
                      ? 'text-white shadow-lg'
                      : 'shadow-sm hover:shadow-md'
                  }`}
                  style={{
                    backgroundColor: completedCells.has(index) ? colorTheme.primary : colorTheme.secondary,
                    borderColor: colorTheme.accent
                  }}
                >
                  <textarea
                    value={goal}
                    onChange={(e) => handleGoalChange(index, e.target.value)}
                    className="w-full h-full resize-none border-none outline-none bg-transparent text-xs leading-tight"
                    style={{ 
                      color: completedCells.has(index) ? '#ffffff' : colorTheme.text,
                      fontSize: '10px'
                    }}
                    placeholder={`目標${index + 1}`}
                  />
                  
                  {/* 完了ボタン */}
                  <button
                    onClick={() => toggleComplete(index)}
                    className={`absolute top-1 right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                      completedCells.has(index)
                        ? 'bg-white text-gray-800 border-white'
                        : 'bg-transparent border-gray-400 text-gray-400 hover:border-gray-600 hover:text-gray-600'
                    }`}
                    title={completedCells.has(index) ? '完了を取り消す' : '完了にする'}
                  >
                    {completedCells.has(index) ? '✓' : '○'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>各セルに目標を入力し、達成したら右上の○ボタンをクリックして完了マークを付けましょう。</p>
            <p>「画像を生成」ボタンで高解像度画像を表示し、右クリックで保存できます。</p>
          </div>
        </div>
      </div>

      {/* 画像プレビューモーダル */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">目標ビンゴ画像</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <img 
                src={previewImage} 
                alt="目標ビンゴ" 
                className="max-w-full h-auto"
                style={{ maxHeight: '70vh' }}
              />
              <div className="mt-4 text-center text-sm text-gray-600">
                <p>💻 PC：右クリックして「名前を付けて画像を保存」を選択</p>
                <p className="text-xs mt-2 text-gray-500">高画質版：2480x3508px (A4印刷対応・300DPI)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 非表示のキャンバス（画像生成用） */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default BingoGoalCreator;
