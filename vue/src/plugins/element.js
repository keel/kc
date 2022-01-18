import Vue from 'vue';
import '../../theme/index.css';
import {
  Button,
  Dialog,
  Card,
  Row,
  Col,
  Progress,
  Container,
  Header,
  Aside,
  Main,
  Footer,
  Menu,
  Submenu,
  MenuItem,
  MenuItemGroup,
  Input,
  Checkbox,
  CheckboxButton,
  DatePicker,
  Link,
  Form,
  FormItem,
  MessageBox,
  Loading,
  Table,
  TableColumn,
  Pagination,
  Breadcrumb,
  BreadcrumbItem,
  Message,
} from 'element-ui';

const commps = [Button,
  Dialog,
  Card,
  Row,
  Col,
  Progress,
  Container,
  Header,
  Aside,
  Main,
  Footer,
  Menu,
  Submenu,
  MenuItem,
  MenuItemGroup,
  Input,
  Checkbox,
  CheckboxButton,
  DatePicker,
  Link,
  Form,
  FormItem,
  Table,
  TableColumn,
  Pagination,
  Breadcrumb,
  BreadcrumbItem,
  // MessageBox,
  // Loading,
];
for (const i in commps) {
  Vue.use(commps[i]);
}

Vue.use(Loading.directive);

Vue.prototype.$loading = Loading.service;
Vue.prototype.$msgbox = MessageBox;
Vue.prototype.$alert = MessageBox.alert;
Vue.prototype.$confirm = MessageBox.confirm;
Vue.prototype.$prompt = MessageBox.prompt;
// Vue.prototype.$notify = Notification;
Vue.prototype.$message = Message;