<template>
  <div class="home">
    <Test1 />
  </div>
</template>

<script>
// @ is an alias to /src
import Test1 from '@/components/Test1.vue'

export default {
  name: 'Home',
  components: {
    Test1
  }
}
</script>
