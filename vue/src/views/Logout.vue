<template>
  <span />
</template>
<script>
export default {
  'name': 'Logout',
  mounted() {
    this.$kc.kPost('/logout', '{}', () => {
      this.$router.push('/login');
    });
  },
}
</script>