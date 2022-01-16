<template>
  <div>
    <CurdList />
    <CurdAdd />
    <CurdOne />
  </div>
</template>
<script>
  import CurdList from '../../components/CurdList.vue';
  import CurdAdd from '../../components/CurdAdd.vue';
  import CurdOne from '../../components/CurdOne.vue';
  export default {
    'name': 'product',
    'components':{
      CurdList,
      CurdAdd,
      CurdOne,
    },
  }
</script>