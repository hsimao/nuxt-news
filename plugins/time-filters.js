import Vue from "vue";
import { distanceInWordsToNow } from "date-fns";
import zh_TW from "date-fns/locale/zh_tw";

Vue.filter("publishedTimeToNow", time => {
  return `${distanceInWordsToNow(time, { locale: zh_TW })}`;
});

Vue.filter("commentTimeToNow", timestamp => {
  const timeElapsed = distanceInWordsToNow(timestamp, {
    includeSeconds: true,
    locale: zh_TW
  });
  return timeElapsed;
});
