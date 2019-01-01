<template>
  <div class="md-layout md-alignment-center"
    style="margin: 5.5em 0;">

    <!-- Navbar Start -->
    <md-toolbar class="fixed-toolbar md-primary"
      md-elevation="1">
      <md-button @click="showLeftSidepanel = true"
        class="md-icon-button">
        <md-icon>menu</md-icon>
      </md-button>
      <nuxt-link class="md-primary md-title" to="/"><span
          v-if="source">{{source.name}}</span>
        新聞
        - {{categoryName}}</nuxt-link>

      <div class="md-toolbar-section-end">
        <!-- 有登入顯示用戶資訊 -->
        <template v-if="auth">
          <md-button>
            <md-avatar>
              <img :src="user.avatar" :alt="user.email">
            </md-avatar>
            {{user.email}}
          </md-button>
          <md-button @click="logout">登出</md-button>
        </template>
        <!-- 沒登入顯示登入、註冊按鈕 -->
        <template v-else>
          <nuxt-link to="/login">
            <md-button>登入</md-button>
          </nuxt-link>
          <nuxt-link to="/register">
            <md-button>註冊</md-button>
          </nuxt-link>
        </template>

        <!-- 搜尋 -->
        <md-button class="md-primary" @click="showSearchDialog = true">搜尋</md-button>

        <md-button @click="showRightSidepanel = true">分類</md-button>
      </div>
    </md-toolbar>
    <!-- Navbar End -->

    <!-- 搜尋彈窗 -->
    <md-dialog :md-active.sync="showSearchDialog">
      <md-dialog-title>搜尋新聞</md-dialog-title>
      <div class="md-layout" style="padding: 1em">
        <md-field>
          <label>關鍵字</label>
          <md-input maxlength="30" v-model="search.query"
            placeholder="輸入關鍵字, 可使用 AND / OR / NOT 來串接搜尋"></md-input>
        </md-field>
        <md-datepicker md-immediately v-model="search.fromDate">
          <label>開始時間</label>
        </md-datepicker>
        <md-datepicker md-immediately v-model="search.toDate">
          <label>結束時間</label>
        </md-datepicker>
        <md-field>
          <label for="sortBy">排列順序</label>
          <md-select md-dense v-model="search.sortBy"
            name="sortBy" id="sortBy">
            <md-option value="publishedAt">依發布時間(預設)</md-option>
            <md-option value="relevancy">依相關性</md-option>
            <md-option value="popularity">依瀏覽人次</md-option>
          </md-select>
        </md-field>
      </div>

      <md-dialog-actions>
        <md-button @click="showSearchDialog = false"
          class="md-accent">
          關閉
        </md-button>
        <md-button @click="searchNews" class="md-primary">搜尋</md-button>
      </md-dialog-actions>
    </md-dialog>

    <!-- 左側彈窗 - 選單 Start -->
    <md-drawer md-fixed :md-active.sync="showLeftSidepanel">
      <md-toolbar md-elevation="0" class="md-primary">
        <span class="md-title">個人化設置</span>
      </md-toolbar>

      <md-progress-bar v-if="loading" md-mode="indeterminate"></md-progress-bar>

      <md-field style="margin: 20px; width: 85%">
        <label for="country">國家</label>
        <md-select @input="changeCountry" :value="country"
          name="country" id="country">
          <md-option value="tw">台灣</md-option>
          <md-option value="cn">中國</md-option>
          <md-option value="us">美國</md-option>
          <md-option value="ca">加拿大</md-option>
          <md-option value="de">德國</md-option>
          <md-option value="ru">俄羅斯</md-option>
        </md-select>
      </md-field>

      <!-- 若還沒登入, 將顯示以下提示畫面 -->
      <md-empty-state class="md-primary" v-if="!user"
        md-icon="bookmarks" md-label="尚未添加新聞"
        md-description="登入後開始收藏新聞">
        <nuxt-link to="/login">
          <md-button class="md-primary md-raised">登入</md-button>
        </nuxt-link>
      </md-empty-state>

      <!-- 已登入但尚未收藏新聞, 將顯示以下提示畫面  -->
      <md-empty-state v-else-if="likes.length === 0"
        class="md-accent" md-icon="bookmark_outline"
        md-label="尚未收藏新聞" md-description="您收藏的新聞都將存儲在此處"></md-empty-state>

      <!-- 收藏內容 likes news -->
      <md-list v-else class="md-triple-line"
        style="width: 90%;" v-for="item in likes"
        :key="item.id">
        <md-list-item>
          <md-avatar>
            <img :src="item.urlToImage" :alt="item.title">
          </md-avatar>
          <div class="md-list-item-text">
            <span><a :href="item.url" target="_blank">{{item.title}}</a></span>
            <span>{{item.source.name}}</span>
            <span style="cursor: pointer;" @click="saveNews(item)">查看留言</span>
          </div>
          <md-button @click="deleteLikes(item)"
            class="md-icon-button md-list-action">
            <md-icon class="md-accent">delete</md-icon>
          </md-button>
        </md-list-item>
        <md-divider class="md-inset"></md-divider>
      </md-list>

    </md-drawer>
    <!-- 左側彈窗 - 選單 End -->

    <!-- 右側彈窗 - 新聞分類 Start -->
    <md-drawer md-fixed :md-active.sync="showRightSidepanel"
      class="md-right">
      <md-toolbar class="md-primary" md-elevation="0">
        <span class="md-title">新聞分類</span>
      </md-toolbar>

      <!-- loading -->
      <md-progress-bar md-mode="indeterminate"
        v-if="loading"></md-progress-bar>

      <md-list>
        <md-subheader class="md-primary">分類</md-subheader>
        <md-list-item v-for="(item, index) in newsCategories"
          :key="index" @click="loadCategory(item.path)">
          <md-icon :class="item.path === category ? 'md-primary' : '' ">{{item.icon}}</md-icon>
          <span class="md-list-item-text">{{item.name}}</span>
        </md-list-item>
      </md-list>
    </md-drawer>
    <!-- 右側彈窗 - 新聞分類 End -->

    <!-- App Content Start -->
    <div class="md-layout-item md-size-95">
      <md-content class="md-layout md-gutter"
        style="padding: 1em;">
        <ul v-for="headline in headlines" :key="headline.id"
          class="md-layout-item md-large-size-25 md-medium-size-33 md-small-size-50 md-xsmall-size-100">
          <md-card class="card">
            <md-ripple>
              <md-card-media md-ratio="16:9">
                <a :href="headline.url" target="_blank">
                  <img :src="headline.urlToImage"
                    :alt="headline.title">
                </a>
              </md-card-media>

              <md-card-header>
                <div class="md-title card-title">
                  {{headline.title}}
                </div>
                <div @click="loadSource(headline)"
                  class="md-subhead" :class="{'hasSource': headline.source.id}">
                  <md-icon class="small-icon">book</md-icon>
                  {{headline.source.name}}
                </div>
                <div class="md-subhead" v-if="headline.author">
                  <md-icon class="small-icon">face</md-icon>
                  {{headline.author}}
                </div>
                <div class="md-subhead">
                  <md-icon class="small-icon">alarm</md-icon>
                  發佈時間：{{headline.publishedAt |
                  publishedTimeToNow}}之前
                </div>
              </md-card-header>

              <md-card-content class="md-caption">
                {{headline.description}}
              </md-card-content>

              <md-card-actions>
                <md-button @click="addLikeNews(headline)"
                  class="md-icon-button" :class="isLikes(headline.title)">
                  <md-icon>bookmark</md-icon>
                </md-button>
                <md-button @click="saveNews(headline)"
                  class="md-icon-button">
                  <md-icon>message</md-icon>
                </md-button>
              </md-card-actions>
            </md-ripple>
          </md-card>
        </ul>
      </md-content>
    </div>
    <!-- App Content End -->
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "index",
  data() {
    return {
      showRightSidepanel: false,
      showLeftSidepanel: false,
      showSearchDialog: false,
      // 新聞分類，對應api分類
      // https://newsapi.org/docs/endpoints/top-headlines
      newsCategories: [
        { name: "今日頭條", path: "", icon: "today" },
        { name: "技術", path: "technology", icon: "keyboard" },
        { name: "商業", path: "business", icon: "business_center" },
        { name: "娛樂", path: "entertainment", icon: "weekend" },
        { name: "健康", path: "health", icon: "fastfood" },
        { name: "科學", path: "science", icon: "fingerprint" },
        { name: "體育", path: "sports", icon: "golf_course" }
      ],
      search: {
        query: "",
        fromDate: "",
        toDate: "",
        sortBy: ""
      }
    };
  },
  computed: {
    ...mapGetters([
      "loading",
      "country",
      "source",
      "headlines",
      "category",
      "auth",
      "user"
    ]),
    likes() {
      return this.$store.getters.likes;
    },
    categoryName() {
      return this.newsCategories.find(item => item.path === this.category).name;
    }
  },
  watch: {
    // 當國家改變時就重新發起API獲取新文章
    async country() {
      await this.$store.dispatch(
        "loadHeadlines",
        `/api/top-headlines?country=${this.country}&category=${this.category}`
      );
    }
  },
  methods: {
    async loadCategory(category) {
      this.$store.commit("setCategory", category);
      await this.$store.dispatch(
        "loadHeadlines",
        `/api/top-headlines?country=${this.country}&category=${this.category}`
      );
    },
    // 載入特定新聞台資訊
    async loadSource(news) {
      if (news.source.id) {
        const source = {
          name: news.source.name,
          id: news.source.id
        };
        this.$store.commit("setSource", source);
        await this.$store.dispatch(
          "loadHeadlines",
          `/api/top-headlines?sources=${this.source.id}`
        );
      }
    },
    async searchNews() {
      const { query, fromDate, toDate, sortBy } = this.search;
      await this.$store.dispatch(
        "loadHeadlines",
        `api/everything?q=${query}
        &from=${this.dateToISOString(fromDate)}
        &to=${this.dateToISOString(toDate)}
        &sortBy=${sortBy}`
      );
      this.clearSearch();
      this.showSearchDialog = false;
    },
    async addLikeNews(news) {
      if (!this.user) return;
      // 如果已經新增，就刪除, 書籤toggle效果
      if (this.likes.findIndex(item => item.title === news.title) > -1) {
        this.deleteLikes(news);
      } else {
        await this.$store.dispatch("addNewsToUser", news);
      }
    },
    async deleteLikes(news) {
      await this.$store.dispatch("deleteLikes", news);
    },
    // 儲存新聞，調用store儲存方法，等資料庫判斷並儲存完後才導向該頁面
    async saveNews(news) {
      await this.$store.dispatch("saveNews", news).then(() => {
        this.$router.push(`/news/${news.newsId}`);
      });
    },
    changeCountry(country) {
      this.$store.commit("setSource", "");
      this.$store.commit("setCountry", country);
    },
    logout() {
      this.$store.dispatch("logoutUser");
    },
    isLikes(newsTitle) {
      const inLikes =
        this.likes.findIndex(item => item.title === newsTitle) > -1;
      return inLikes ? "md-primary" : "";
    },
    dateToISOString(date) {
      if (date) {
        return new Date(date).toISOString();
      }
    },
    clearSearch() {
      this.search.query = "";
      this.search.fromDate = "";
      this.search.toDate = "";
      this.search.sortBy = "";
    }
  },
  /**
   * fetch loadData 從伺服器端載入資料
   * 在後端發起API請求，後端渲染完後才傳回到前端(SSR)
   * 取得新聞
   * 取得個人likes新聞
   */
  async fetch({ store }) {
    // 取得新聞
    await store.dispatch(
      "loadHeadlines",
      `/api/top-headlines?country=${store.state.country}&category=${
        store.state.category
      }`
    );

    await store.dispatch("loadUserLikes");
  }
};
</script>

<style lang="scss" scope>
$colorPrimary: #5770f6;

.card {
  margin-top: 1em;
  border-bottom: solid 4px $colorPrimary;
}

.card-title {
  margin-bottom: 20px !important;
}

.md-subhead {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.md-caption {
  color: lighten(black, 35) !important;
}

.small-icon {
  font-size: 18px !important;
}

.fixed-toolbar {
  position: fixed;
  top: 0;
  z-index: 5;
}

.md-toolbar .md-button {
  font-size: 16px;
}

a {
  text-decoration: none !important;
}

.hasSource {
  color: $colorPrimary;
  cursor: pointer;
  i {
    color: $colorPrimary !important;
    vertical-align: midde;
  }
}
</style>
