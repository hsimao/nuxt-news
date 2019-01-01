<template>
  <div class="md-layout md-alignment-center"
    style="margin: 5em 0;">
    <div class="md-layout-item md-size-75 md-small-size-80 md-xsmall-size-100">
      <!-- News Desc -->
      <md-card :md-inset="true">
        <a :href="news.url" target="_blank">
          <md-card-media style="hegith: 300px"
            md-ratio="16:9">
            <img :src="news.urlToImage" :alt="news.title">
          </md-card-media>
        </a>
        <md-card-header>
          <div class="md-title">{{news.title}}</div>
          <div v-if="news.source.name" style="margin-top: 1em;">
            <md-icon>book</md-icon>
            <span class="vertical-center">{{news.source.name}}</span>
          </div>
          <div class="md-subhead" v-if="news.author"
            style="margin-top: 0.5em;">
            <md-icon>face</md-icon>
            <span class="vertical-center">{{news.author}}</span>
          </div>
        </md-card-header>
        <md-card-content>{{news.description}}</md-card-content>
      </md-card>

      <!-- 登入留言提示 -->
      <md-toolbar v-if="!user" md-elevation="1"
        style="margin-top: 2em;">
        <h3 class="md-title">登入即可留言</h3>
        <nuxt-link to="/login" style="margin-left: 2em">
          <md-button class="md-raised md-primary">登入</md-button>
        </nuxt-link>
        <nuxt-link to="/register" style="margin-left: 1em">
          <md-button class="md-primary">註冊</md-button>
        </nuxt-link>
      </md-toolbar>

      <!-- Comment form -->
      <form v-else @submit.prevent="sendComment"
        style="margin-top: 2em;">
        <md-field class="textarea-border">
          <label>輸入留言</label>
          <md-icon>description</md-icon>
          <md-textarea v-model="text" :disabled="loading || !user"></md-textarea>
        </md-field>
        <md-button class="md-primary md-raised"
          type="submit" :disabled="loading || !user">送出</md-button>
      </form>

      <!-- Comments -->
      <md-list class="md-triple-line" style="margin-top: 1em">
        <md-list-item class="comment-item" v-for="item in news.comments"
          :key="item.id">

          <md-avatar>
            <img :src="item.user.avatar" :alt="item.user.username">
          </md-avatar>

          <div class="md-list-item-text">
            <span>{{item.user.username}}</span>
            <span>留言時間：{{item.publishedAt |
              commentTimeToNow}}之前</span>
            <p>{{item.text}}</p>
          </div>

          <!-- likes按鈕 -->
          <md-button @click="likeComment(item.id)"
            class="md-icon-button" :disabled="loading || !user">
            <md-icon>thumb_up</md-icon>
          </md-button>
          <md-badge class="md-primary"
            md-position="bottom" :md-content="item.likes.length" />

        </md-list-item>
      </md-list>

      <!-- Back button -->
      <md-button @click="$router.go(-1)" class="md-fixed md-fab-bottom-right md-fab md-primary">
        <md-icon>arrow_back</md-icon>
      </md-button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import uuidv4 from "uuid/v4";

export default {
  name: "newsPage",
  data() {
    return {
      text: ""
    };
  },
  // 利用fetch於後端先從資料庫獲取該篇新聞，並將資料儲存於store，才回傳至前端
  async fetch({ store, params }) {
    await store.dispatch("loadNews", params.id);
  },
  computed: {
    ...mapGetters(["loading", "user", "news"])
  },
  methods: {
    async sendComment() {
      const commit = {
        id: uuidv4(),
        text: this.text,
        user: this.getCommentUserData(),
        publishedAt: Date.now(),
        likes: []
      };
      await this.$store.dispatch("sendComment", commit);
      this.text = "";
    },
    getCommentUserData() {
      // 抓出當前使用者資料，並將信箱前綴當成username
      const commentUserData = { ...this.user };
      commentUserData["username"] = commentUserData["email"].split("@")[0];
      return commentUserData;
    },
    async likeComment(commentId) {
      await this.$store.dispatch("likeComment", commentId);
    }
  }
};
</script>

<style scoped lang="scss">
.vertical-center {
  vertical-align: middle;
}

.textarea-border {
  &:after {
    opacity: 0.5;
  }
}
.comment-item {
  border-bottom: solid 1px rgba(gray, 0.2);
}
</style>