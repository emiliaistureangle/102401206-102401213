'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const LostFound = require('../js/lost-found.js');

const sample = {
  id: 1,
  title: '蓝色校园卡',
  type: 'lost',
  cat: '证件卡类',
  status: 'open',
  place: '第三教学楼',
  contact: '12345',
  desc: '蓝色卡套',
  user: '小林',
  days: 1
};

test('空信息逐项报告必填字段错误', function () {
  assert.deepEqual(LostFound.validateItem({ type: 'lost' }), [
    '请先填写物品名称',
    '请填写丢失或拾取地点',
    '请填写丢失或拾取时间',
    '请填写联系方式'
  ]);
});

test('非对象输入会给出明确校验错误', function () {
  assert.deepEqual(LostFound.validateItem(null), ['请填写有效的信息']);
});

test('类型只接受寻物或招领', function () {
  const errors = LostFound.validateItem({
    title: '水杯', place: '图书馆', time: '今天', contact: '微信号', type: 'other'
  });
  assert.deepEqual(errors, ['请选择寻物或招领类型']);
});

test('有效字段两端空格会在创建时清除', function () {
  const result = LostFound.createItem([], {
    title: ' 雨伞 ', place: ' 食堂 ', time: ' 今天 ', contact: ' 微信 ', type: 'found'
  }, new Date('2026-10-09T01:00:00.000Z'));
  assert.equal(result.errors, undefined);
  assert.equal(result.item.title, '雨伞');
  assert.equal(result.item.place, '食堂');
  assert.equal(result.item.type, 'found');
});

test('新建条目使用唯一递增编号并默认开放状态', function () {
  const result = LostFound.createItem([{ id: 2 }, { id: 8 }], {
    title: '钥匙', place: '宿舍', time: '今天', contact: '12345', type: 'lost'
  }, new Date('2026-10-09T01:00:00.000Z'));
  assert.equal(result.item.id, 9);
  assert.equal(result.item.status, 'open');
  assert.equal(result.item.state, '寻找中');
});

test('招领信息默认显示待认领状态', function () {
  const result = LostFound.createItem([], {
    title: '钥匙', place: '宿舍', time: '今天', contact: '12345', type: 'found'
  });
  assert.equal(result.item.state, '待认领');
});

test('描述可选，缺少描述时提供清晰默认文案', function () {
  const result = LostFound.createItem([], {
    title: '书', place: '教室', time: '今天', contact: '微信', type: 'lost'
  });
  assert.equal(result.item.desc, '（发布者未填写详细描述）');
});

test('关键词搜索忽略大小写并匹配物品字段', function () {
  const items = [sample, { ...sample, id: 2, title: '蓝牙耳机' }];
  assert.deepEqual(LostFound.searchItems(items, { keyword: '校园卡' }), [sample]);
});

test('地点和描述也可被关键词命中', function () {
  assert.deepEqual(LostFound.searchItems([sample], { keyword: '卡套' }), [sample]);
});

test('搜索可按寻物或招领类型过滤', function () {
  const items = [sample, { ...sample, id: 2, type: 'found' }];
  assert.deepEqual(LostFound.searchItems(items, { type: 'found' }), [items[1]]);
});

test('时间筛选限制最近条目，且不限时间时返回全部', function () {
  const items = [sample, { ...sample, id: 2, days: 5 }];
  assert.deepEqual(LostFound.searchItems(items, { maxDays: 2 }), [sample]);
  assert.equal(LostFound.searchItems(items, {}).length, 2);
});

test('最近时间筛选按发布时刻动态计算，不会让旧发布永远保持为最新', function () {
  const now = Date.parse('2026-10-09T12:00:00.000Z');
  const items = [
    { ...sample, id: 1, createdAt: '2026-10-07T13:00:00.000Z' },
    { ...sample, id: 2, createdAt: '2026-10-05T12:00:00.000Z' }
  ];
  assert.deepEqual(
    LostFound.searchItems(items, { maxDays: 2, now }).map(function (item) { return item.id; }),
    [1]
  );
});

test('寻物发布者标记后显示已找到，重复标记无副作用', function () {
  const item = { ...sample };
  assert.equal(LostFound.resolveItem(item), true);
  assert.equal(item.state, '已找到');
  assert.equal(LostFound.resolveItem(item), false);
});

test('招领发布者标记后显示已归还', function () {
  const item = { ...sample, type: 'found' };
  assert.equal(LostFound.resolveItem(item), true);
  assert.equal(item.state, '已归还');
});

test('不存在的条目不能变更状态', function () {
  assert.equal(LostFound.resolveItem(null), false);
});

test('保存与读取数据可往返保留发布和收藏', function () {
  let value = null;
  const storage = {
    getItem: function () { return value; },
    setItem: function (key, next) { value = next; }
  };
  const items = [sample];
  LostFound.writeState(storage, items, new Set([1]));
  const restored = LostFound.readState(storage, []);
  assert.deepEqual(restored.items, items);
  assert.deepEqual(restored.favorites, [1]);
  assert.equal(restored.error, null);
});

test('损坏的本地数据会返回错误并保留种子数据', function () {
  const restored = LostFound.readState({
    getItem: function () { return '{invalid'; }
  }, [sample]);
  assert.deepEqual(restored.items, [sample]);
  assert.ok(restored.error instanceof Error);
});

test('本地数据编号重复时拒绝加载并报告错误', function () {
  const duplicate = JSON.stringify({ items: [sample, sample], favorites: [] });
  const restored = LostFound.readState({
    getItem: function () { return duplicate; }
  }, []);
  assert.match(restored.error.message, /编号重复/);
  assert.deepEqual(restored.items, []);
});

test('收藏指向不存在的信息时拒绝加载', function () {
  const invalid = JSON.stringify({ items: [sample], favorites: [999] });
  const restored = LostFound.readState({
    getItem: function () { return invalid; }
  }, []);
  assert.match(restored.error.message, /不存在/);
});
