const { parseHtml } = require('../../lib/parseHtml');
const sort = require('../../lib/sort');
const info = require('../../lib/parseResumeYaml');
const { handleXOR } = require('../../lib/encrypt');
const fs = require('fs');
const path = require('path');
const rootPath = path.join(__dirname, '../../');
const BLACK_LIST = ['meijian', 'mj', '公司', 'meijian-development', '公司相关', 'login', '转正']; // 这样就没意思了，想办法变通一下过滤方法
const { parseContent } = require('../../lib/parseHtml');

module.exports = (router) => {
  const index = async ctx => {
    const fetchedGDList = require('../../data.json');
    const { token } = ctx.query;
    const { title, date, html } = await parseContent(token);
    ctx.body = {
      article: {
        title,
        date,
        html
      },
      articleCounts: fetchedGDList.length // 文章数量
    };
  };

  const articleList = (ctx) => {
    const fetchedGDList = require('../../data.json');
    const foldersList = fetchedGDList.reduce((prevItem, currentItem) => {
      const [folderId, structrue = {}] = currentItem;
      const { folderName = '', files = [] } = structrue
      const entityFiles = files.filter(item => item.name !== 'Untitled.md' && item.name !== 'index.md');
      const formatFolderStructure = {
        id: folderId,
        folderName,
        files: entityFiles
      };
      prevItem.push(formatFolderStructure);
      return prevItem;
    }, []);
    ctx.body = {
      list: [...foldersList.filter(item => {
        const { folderName } = item;
        return !!folderName && !BLACK_LIST.includes(folderName)
      })]
    };
  };

  const getResume = (ctx) => {
    const key = fs.readFileSync(`${rootPath}/key`).toString().split(' ')[0];
    let infomation = info();
    infomation.data.intro.forEach(item => {
      if (!isNaN(item.val)) { // 如果是电话号码
        item.val = handleXOR(item.val, key)
      }
      return item
    });
    ctx.body = {
      info: infomation
    };
  };

  router.get('/api', index);
  router.get('/list', articleList);
  router.get('/resume', getResume);
  return router
};
