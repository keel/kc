<template>
  <div>
    <TableList />
    <TableAdd />
  </div>
</template>
<script>
  import TableList from '../../components/TableList.vue';
  import TableAdd from '../../components/TableAdd.vue';
  export default {
    'name': 'Product',
    'components':{
      TableList,
      TableAdd,
    },
  }
</script>