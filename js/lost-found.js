(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.LostFound = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function validateItem(input) {
    const errors = [];
    if (!input || typeof input !== 'object') return ['请填写有效的信息'];
    if (!String(input.title || '').trim()) errors.push('请先填写物品名称');
    if (!String(input.place || '').trim()) errors.push('请填写丢失或拾取地点');
    if (!String(input.time || '').trim()) errors.push('请填写丢失或拾取时间');
    if (!String(input.contact || '').trim()) errors.push('请填写联系方式');
    if (input.type !== 'lost' && input.type !== 'found') errors.push('请选择寻物或招领类型');
    return errors;
  }

  function createItem(items, input, now) {
    const errors = validateItem(input);
    if (errors.length) return { errors: errors };
    const id = items.reduce(function (max, item) {
      return Math.max(max, Number(item.id) || 0);
    }, -1) + 1;
    const createdAt = now || new Date();
    const createdLabel = [
      createdAt.getFullYear(),
      String(createdAt.getMonth() + 1).padStart(2, '0'),
      String(createdAt.getDate()).padStart(2, '0')
    ].join('-') + ' ' + [
      String(createdAt.getHours()).padStart(2, '0'),
      String(createdAt.getMinutes()).padStart(2, '0')
    ].join(':');
    const title = String(input.title).trim();
    const place = String(input.place).trim();
    const type = input.type;
    return {
      item: {
        id: id,
        emoji: input.emoji || '📦',
        bg: input.bg || '#f1f2f7',
        mine: true,
        views: 0,
        title: title,
        type: type,
        cat: String(input.cat || '其他').trim(),
        status: 'open',
        state: type === 'lost' ? '寻找中' : '待认领',
        place: place,
        placeShort: place,
        time: String(input.time).trim(),
        timeShort: '刚刚',
        days: 0,
        createdAt: createdAt.toISOString(),
        post: createdLabel,
        postShort: '刚刚发布',
        user: String(input.user || '我').trim(),
        contact: String(input.contact).trim(),
        desc: String(input.desc || '').trim() || '（发布者未填写详细描述）'
      }
    };
  }

  function searchItems(items, options) {
    const settings = options || {};
    const keyword = String(settings.keyword || '').trim().toLocaleLowerCase();
    const type = settings.type || 'all';
    const maxDays = Number.isFinite(settings.maxDays) ? settings.maxDays : Infinity;
    const now = Number.isFinite(settings.now) ? settings.now : Date.now();
    return items.filter(function (item) {
      const searchable = [item.title, item.cat, item.place, item.desc, item.user]
        .join(' ').toLocaleLowerCase();
      const createdAt = Date.parse(item.createdAt);
      const daysOld = Number.isFinite(createdAt)
        ? Math.max(0, Math.floor((now - createdAt) / 86400000))
        : Number(item.days) || 0;
      return (!keyword || searchable.includes(keyword))
        && (type === 'all' || item.type === type)
        && daysOld <= maxDays;
    });
  }

  function resolveItem(item) {
    if (!item || item.status === 'done') return false;
    item.status = 'done';
    item.state = item.type === 'lost' ? '已找到' : '已归还';
    return true;
  }

  function readState(storage, seeds) {
    const fallback = { items: seeds.slice(), favorites: [], error: null };
    try {
      const saved = storage.getItem('school-things-find-state');
      if (!saved) return fallback;
      const parsed = JSON.parse(saved);
      if (!parsed || !Array.isArray(parsed.items) || !Array.isArray(parsed.favorites)) {
        throw new Error('保存的数据格式不正确');
      }
      const ids = new Set();
      parsed.items.forEach(function (item) {
        if (!item || !Number.isInteger(item.id)
          || (item.type !== 'lost' && item.type !== 'found')
          || (item.status !== 'open' && item.status !== 'done')
          || !String(item.title || '').trim()
          || !String(item.place || '').trim()
          || !String(item.contact || '').trim()
          || ids.has(item.id)) {
          throw new Error('保存的信息字段缺失或编号重复');
        }
        ids.add(item.id);
      });
      if (parsed.favorites.some(function (id) { return !ids.has(id); })) {
        throw new Error('收藏记录指向不存在的信息');
      }
      return { items: parsed.items, favorites: parsed.favorites, error: null };
    } catch (error) {
      fallback.error = error;
      return fallback;
    }
  }

  function writeState(storage, items, favorites) {
    storage.setItem('school-things-find-state', JSON.stringify({
      items: items,
      favorites: Array.from(favorites)
    }));
  }

  return {
    createItem: createItem,
    readState: readState,
    resolveItem: resolveItem,
    searchItems: searchItems,
    validateItem: validateItem,
    writeState: writeState
  };
}));
