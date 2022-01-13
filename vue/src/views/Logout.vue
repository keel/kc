<template>
  <LoginForm />
</template>
<script>
  import LoginForm from '../components/LoginForm.vue';
  export default {
    'name': 'Logout',
    'components':{
      LoginForm
    },
    mounted(){
      this.$kc.kGet('/logout',() => {
        console.log('logout');
      });
    },
  }
</script>