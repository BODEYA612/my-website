/* ========================================
   AI Design Page - JavaScript
   ======================================== */

const API_BASE = '/api';
const API_KEY = 'sk-jp-AlTBnlYvIc1Cdj7TkhCOsxi8dztkjEeUkKwy3uTw';

document.addEventListener('DOMContentLoaded', () => {

  // --- DOM Elements ---
  const modeTabs = document.querySelectorAll('.mode-tab');
  const text2imgPanel = document.getElementById('text2imgPanel');
  const img2imgPanel = document.getElementById('img2imgPanel');
  const generateBtn = document.getElementById('generateBtn');
  const btnText = document.getElementById('btnText');

  const resultEmpty = document.getElementById('resultEmpty');
  const resultLoading = document.getElementById('resultLoading');
  const resultContent = document.getElementById('resultContent');
  const resultError = document.getElementById('resultError');
  const resultImage = document.getElementById('resultImage');
  const downloadBtn = document.getElementById('downloadBtn');
  const errorMessage = document.getElementById('errorMessage');

  const promptInput = document.getElementById('promptInput');
  const promptInput2 = document.getElementById('promptInput2');
  const modelSelect = document.getElementById('modelSelect');
  const modelSelect2 = document.getElementById('modelSelect2');
  const qualitySelect = document.getElementById('qualitySelect');

  const uploadArea = document.getElementById('uploadArea');
  const imageUpload = document.getElementById('imageUpload');
  const uploadPlaceholder = document.getElementById('uploadPlaceholder');
  const uploadPreview = document.getElementById('uploadPreview');
  const previewImg = document.getElementById('previewImg');
  const removeImg = document.getElementById('removeImg');

  const historyGrid = document.getElementById('historyGrid');
  const clearHistory = document.getElementById('clearHistory');
  const regenerateBtn = document.getElementById('regenerateBtn');
  const retryBtn = document.getElementById('retryBtn');

  let currentMode = 'text2img';
  let selectedSize = '1024x1024';
  let selectedSize2 = '1024x1024';
  let uploadedFile = null;
  let isGenerating = false;

  // --- Mode Switching ---
  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      modeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentMode = tab.getAttribute('data-mode');

      if (currentMode === 'text2img') {
        text2imgPanel.classList.remove('hidden');
        img2imgPanel.classList.add('hidden');
      } else {
        text2imgPanel.classList.add('hidden');
        img2imgPanel.classList.remove('hidden');
      }
    });
  });

  // --- Size Selection ---
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSize = btn.getAttribute('data-size');
    });
  });

  document.querySelectorAll('.size-btn-2').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn-2').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSize2 = btn.getAttribute('data-size');
    });
  });

  // --- Prompt Suggestions ---
  document.querySelectorAll('.suggestion-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      promptInput.value = tag.getAttribute('data-prompt');
      promptInput.focus();
    });
  });

  // --- Image Upload ---
  uploadArea.addEventListener('click', () => {
    if (!uploadedFile) imageUpload.click();
  });

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  });

  imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleImageUpload(file);
  });

  removeImg.addEventListener('click', (e) => {
    e.stopPropagation();
    uploadedFile = null;
    uploadPlaceholder.style.display = '';
    uploadPreview.classList.add('hidden');
    imageUpload.value = '';
  });

  function handleImageUpload(file) {
    if (file.size > 4 * 1024 * 1024) {
      showToast('图片大小不能超过 4MB', 'error');
      return;
    }
    uploadedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      uploadPlaceholder.style.display = 'none';
      uploadPreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  // --- Generate ---
  generateBtn.addEventListener('click', handleGenerate);
  regenerateBtn.addEventListener('click', handleGenerate);
  retryBtn.addEventListener('click', handleGenerate);

  async function handleGenerate() {
    if (isGenerating) return;

    if (currentMode === 'text2img') {
      const prompt = promptInput.value.trim();
      if (!prompt) {
        showToast('请输入描述提示词', 'error');
        promptInput.focus();
        return;
      }
      await generateText2Img(prompt);
    } else {
      const prompt = promptInput2.value.trim();
      if (!uploadedFile) {
        showToast('请先上传参考图片', 'error');
        return;
      }
      if (!prompt) {
        showToast('请输入修改描述', 'error');
        promptInput2.focus();
        return;
      }
      await generateImg2Img(prompt);
    }
  }

  async function generateText2Img(prompt) {
    setLoading(true);

    const model = modelSelect.value;
    const quality = qualitySelect.value;

    const body = {
      model: model,
      prompt: prompt,
      n: 1,
      size: selectedSize,
    };

    if (quality !== 'auto') {
      body.quality = quality;
    }

    try {
      console.log('[Text2Img] Requesting:', `${API_BASE}/images/generations`, body);
      const response = await fetch(`${API_BASE}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      console.log('[Text2Img] Response status:', response.status, 'body:', responseText);

      if (!response.ok) {
        let errMsg = `请求失败 (${response.status})`;
        try {
          const errData = JSON.parse(responseText);
          errMsg = errData.error?.message || errMsg;
        } catch(e) {}
        throw new Error(errMsg);
      }

      const data = JSON.parse(responseText);
      handleSuccess(data, prompt);

    } catch (err) {
      console.error('[Text2Img] Error:', err);
      handleError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function generateImg2Img(prompt) {
    setLoading(true);

    const model = modelSelect2.value;
    const formData = new FormData();
    formData.append('image', uploadedFile);
    formData.append('prompt', prompt);
    formData.append('model', model);
    formData.append('n', '1');
    formData.append('size', selectedSize2);

    try {
      console.log('[Img2Img] Requesting:', `${API_BASE}/images/edits`, 'model:', model, 'size:', selectedSize2);
      const response = await fetch(`${API_BASE}/images/edits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: formData,
      });

      const responseText = await response.text();
      console.log('[Img2Img] Response status:', response.status, 'body:', responseText.substring(0, 500));

      if (!response.ok) {
        let errMsg = `请求失败 (${response.status})`;
        try {
          const errData = JSON.parse(responseText);
          errMsg = errData.error?.message || errMsg;
        } catch(e) {}
        throw new Error(errMsg);
      }

      const data = JSON.parse(responseText);
      handleSuccess(data, prompt);

    } catch (err) {
      console.error('[Img2Img] Error:', err);
      handleError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSuccess(data, prompt) {
    let imageUrl = '';

    if (data.data && data.data.length > 0) {
      const item = data.data[0];
      if (item.url) {
        imageUrl = item.url;
      } else if (item.b64_json) {
        imageUrl = `data:image/png;base64,${item.b64_json}`;
      }
    }

    if (!imageUrl) {
      handleError('未能获取生成的图片');
      return;
    }

    resultImage.src = imageUrl;
    downloadBtn.href = imageUrl;

    showResult('content');
    addToHistory(imageUrl, prompt);
    showToast('生成成功！', 'success');
  }

  function handleError(message) {
    errorMessage.textContent = message || '请检查网络连接或稍后重试';
    showResult('error');
  }

  function setLoading(loading) {
    isGenerating = loading;
    generateBtn.disabled = loading;

    if (loading) {
      btnText.innerHTML = 'AI 生成中<span class="loading-dots"></span>';
      showResult('loading');
    } else {
      btnText.textContent = '生成设计图';
    }
  }

  function showResult(state) {
    resultEmpty.classList.add('hidden');
    resultLoading.classList.add('hidden');
    resultContent.classList.add('hidden');
    resultError.classList.add('hidden');

    switch (state) {
      case 'loading': resultLoading.classList.remove('hidden'); break;
      case 'content': resultContent.classList.remove('hidden'); break;
      case 'error': resultError.classList.remove('hidden'); break;
      default: resultEmpty.classList.remove('hidden');
    }
  }

  // --- History ---
  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem('bodeya_ai_history') || '[]');
    } catch { return []; }
  }

  function saveHistory(history) {
    localStorage.setItem('bodeya_ai_history', JSON.stringify(history.slice(0, 20)));
  }

  function addToHistory(imageUrl, prompt) {
    const history = getHistory();
    history.unshift({ url: imageUrl, prompt, time: Date.now() });
    saveHistory(history);
    renderHistory();
  }

  function renderHistory() {
    const history = getHistory();
    if (history.length === 0) {
      historyGrid.innerHTML = '<div class="history-empty">暂无生成记录</div>';
      return;
    }

    historyGrid.innerHTML = history.map((item, i) => `
      <div class="history-item" data-index="${i}">
        <img src="${item.url}" alt="history" loading="lazy" />
        <div class="history-overlay">
          <p>${item.prompt || '无描述'}</p>
        </div>
      </div>
    `).join('');

    historyGrid.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const index = parseInt(el.getAttribute('data-index'));
        const item = history[index];
        if (item) {
          resultImage.src = item.url;
          downloadBtn.href = item.url;
          showResult('content');
        }
      });
    });
  }

  clearHistory.addEventListener('click', () => {
    localStorage.removeItem('bodeya_ai_history');
    renderHistory();
    showToast('历史已清空', 'success');
  });

  // Init history
  renderHistory();

  // --- Mobile Nav ---
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });
  }

  // --- Toast ---
  function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '&#10003;' : '&#33;'}</span>
      <span>${message}</span>
    `;

    Object.assign(toast.style, {
      position: 'fixed',
      top: '24px',
      right: '24px',
      zIndex: '9999',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '14px 24px',
      borderRadius: '12px',
      fontSize: '14px',
      fontFamily: 'var(--font)',
      color: '#fff',
      background: type === 'success'
        ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
        : 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      transform: 'translateX(120%)',
      transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    });

    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });

    setTimeout(() => {
      toast.style.transform = 'translateX(120%)';
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

});
