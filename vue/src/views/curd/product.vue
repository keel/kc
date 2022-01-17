<template>
  <div>
    <CurdList tbName="product" tbTxt="产品" />
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