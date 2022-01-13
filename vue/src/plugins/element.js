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
];
for (const i in commps) {
  Vue.use(commps[i]);
}