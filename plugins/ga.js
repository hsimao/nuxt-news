/*
 ** 只在生成模式的客戶端中使用
 */
if (process.client && process.env.NODE_ENV === "production") {
  /*
   ** Google 統計分析腳本
   */
  (function(i, s, o, g, r, a, m) {
    i["GoogleAnalyticsObject"] = r;
    (i[r] =
      i[r] ||
      function() {
        (i[r].q = i[r].q || []).push(arguments);
      }),
      (i[r].l = 1 * new Date());
    (a = s.createElement(o)), (m = s.getElementsByTagName(o)[0]);
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m);
  })(
    window,
    document,
    "script",
    "https://www.google-analytics.com/analytics.js",
    "ga"
  );
  /*
   ** 當前頁的訪問統計
   */
  ga("create", "UA-36884000-3", "auto");
}

export default ({ app: { router }, store }) => {
  /*
   ** 每次路由變更時進行pv統計
   */
  router.afterEach((to, from) => {
    /*
     ** 告訴 GA 增加一個 PV
     */
    ga("set", "page", to.fullPath);
    ga("send", "pageview");
  });
};
