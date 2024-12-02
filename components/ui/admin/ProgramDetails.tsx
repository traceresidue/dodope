import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  Edit,
  SimpleForm,
  TextInput,
  BooleanInput,
  Create,
} from 'react-admin';

export const ProgramDetailsList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="programshortname" />
      <TextField source="programname" />
      <TextField source="programdescription" />
      <BooleanField source="disabled" />
    </Datagrid>
  </List>
);

export const ProgramDetailsEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="programshortname" />
      <TextInput source="programname" />
      <TextInput source="programdescription" multiline />
      <TextInput source="programlogo" />
      <TextInput source="programurl" />
      <BooleanInput source="disabled" />
    </SimpleForm>
  </Edit>
);

export const ProgramDetailsCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="programshortname" />
      <TextInput source="programname" />
      <TextInput source="programdescription" multiline />
      <TextInput source="programlogo" />
      <TextInput source="programurl" />
      <BooleanInput source="disabled" />
    </SimpleForm>
  </Create>
);

