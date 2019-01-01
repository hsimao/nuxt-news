export default function({ store, redirect }) {
  if (store.getters.auth) {
    return redirect("/");
  }
}
