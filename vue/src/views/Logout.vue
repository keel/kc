<template>
  <span />
</template>
<script>
export default {
  'name': 'Logout',
  mounted() {
    this.$kc.kPost(this,' /logout', '{}', () => {
      this.$router.push('/login');
    });
  },
}
</script>