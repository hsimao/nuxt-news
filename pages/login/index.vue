<template>
  <div class="md-layout md-alignment-center-center"
    style="height: 100vh;">
    <md-card class="md-layout-item md-size-50">
      <md-card-header>
        <div class="md-title">登入</div>
      </md-card-header>

      <!-- Form Start -->
      <form @submit.prevent="validateForm">
        <md-card-content>
          <!-- email -->
          <md-field md-clearable :class="getValidationClass('email')">
            <label for="email">Email</label>
            <md-input type="email" name="email"
              id="email" autocomplete="email"
              v-model="form.email" :disabled="loading"></md-input>
            <span class="md-error" v-if="!$v.form.email.required">Email不能為空！</span>
            <span class="md-error" v-else-if="!$v.form.email.email">Email格式錯誤！</span>
          </md-field>

          <!-- password -->
          <md-field md-clearable :class="getValidationClass('password')">
            <label for="password">Password</label>
            <md-input type="password" name="password"
              id="password" autocomplete="password"
              v-model="form.password" :disabled="loading"></md-input>
            <span class="md-error" v-if="!$v.form.password.required">密碼不能為空！</span>
            <span class="md-error" v-else-if="!$v.form.password.minLength">不能少於6字元！</span>
            <span class="md-error" v-else-if="!$v.form.password.maxLength">不能大於20字元！</span>
          </md-field>
        </md-card-content>

        <md-card-actions>
          <md-button>
            <nuxt-link to="/register">尚未註冊</nuxt-link>
          </md-button>
          <md-button class="md-primary md-raised"
            type="submit" :disabled="loading">登入</md-button>
        </md-card-actions>
      </form>
      <!-- Form End -->

      <!-- 提示窗 -->
      <md-snackbar :md-active.sync="auth">
        {{form.email}} 登入成功
      </md-snackbar>

    </md-card>

    <!-- Back button -->
    <md-button @click="$router.go(-1)" class="md-fixed md-fab-bottom-right md-fab md-primary">
      <md-icon>arrow_back</md-icon>
    </md-button>
  </div>
</template>

<script>
import { validationMixin } from "vuelidate";
import {
  required,
  email,
  minLength,
  maxLength
} from "vuelidate/lib/validators";

import { mapGetters } from "vuex";

export default {
  name: "login",
  middleware: "auth",
  mixins: [validationMixin],
  data() {
    return {
      form: {
        email: "",
        password: ""
      }
    };
  },
  computed: {
    ...mapGetters(["loading", "auth"])
  },
  watch: {
    // 成功取得token後兩秒返回首頁
    auth(token) {
      if (token) {
        setTimeout(() => {
          // 登入成功後返回上一頁
          this.$router.go(-1);
        }, 1000);
      }
    }
  },
  methods: {
    async loginUser() {
      await this.$store.dispatch("authUser", {
        action: "login",
        email: this.form.email,
        password: this.form.password,
        returnSecureToken: true
      });
    },
    validateForm() {
      this.$v.$touch();
      if (!this.$v.$invalid) {
        this.loginUser();
      }
    },
    getValidationClass(fieldName) {
      const field = this.$v.form[fieldName];
      if (field) {
        return {
          "md-invalid": field.$invalid && field.$dirty
        };
      }
    }
  },
  // 驗證功能
  validations: {
    form: {
      email: {
        required,
        email
      },
      password: {
        required,
        minLength: minLength(6),
        maxLength: maxLength(20)
      }
    }
  }
};
</script>

<style scoped>
.md-button a {
  text-decoration: none;
}
</style>