import './App.css';
import { Button, FormProps } from 'antd';
import { useForm, SubmitHandler } from "react-hook-form";
import { useState } from 'react';
import { Form, Input, InputNumber, Popconfirm, Table, Typography, Checkbox } from 'antd';
import type { TableProps } from 'antd';
import parameterRecommend from './parameterRecommender';

type Inputs = {
  example: string
  exampleRequired: string
  orgName: string
  orgDesc: string
  orgUrl: string
  creatorCountry: string
  creatorEmail: string
  creatorInst: string
  creatorType: string
  creatorSector: string
  orgPlatformId: string
  platformName: string
  platformType: string
  dataSetType: string
  latitude: number
  longitude: number
  dataSetInfoURL: string
  dataSetSummary: string
  dataSetTitle: string
  dataSetWmoPlatformCode: string
  dataSetNcdbId: string
  dataSetNcdbSharing: boolean
}

interface ProviderParameter {
  key: string
  parameter_name: string
  standard_name: string
  parameter_depth: number
}

interface RecommendedParameter {
  standard_name: string
  description: string
}

const RecommendedParameterColumns = [
  { title: 'Recommended Standard Names', dataIndex: 'standard_name', key: 'standard_name' },
];

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: any;
  inputType: 'number' | 'text';
  record: ProviderParameter;
  index: number;
}

const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  ...restProps
}) => {
  const inputNode = inputType === 'number' ? <InputNumber /> : <Input />;

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[
            {
              required: true,
              message: `Please Input ${title}!`,
            },
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};



function App() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>()
  const [form] = Form.useForm();

  const defaultPlatformParameters = [
    {
      key: '1',
      parameter_name: '',
      standard_name: '',
      parameter_depth: 0.0,
    }
  ];

  const defaultRecommendedParameters = [
    {
      standard_name: '',
      description: '',
    }
  ];

  const [data, setData] = useState(defaultPlatformParameters);
  const [currStdName, setCurrStdName] = useState('');
  const [recommendedParameters, setRecommendedParameters] = useState(defaultRecommendedParameters);
  const [showRecommendedParameters, setShowRecommendedParameters] = useState(false);
  const [editingKey, setEditingKey] = useState('');

  const parameterRecommendTrigger = (pquery: string) => {
    const tempRecommendedParameters = parameterRecommend(pquery);
    const recommendedParameters = tempRecommendedParameters.map((param, i) => {
      return {
        key: i+1,
        standard_name: param.standard_name,
        description: param.display_description.en,
      };
    });
    setRecommendedParameters(recommendedParameters);
    setShowRecommendedParameters(true);
  };

  const isEditing = (record: ProviderParameter) => record.key === editingKey;

  const edit = (record: Partial<ProviderParameter> & { key: React.Key }) => {
    form.setFieldsValue({ parameter_name: '', standard_name: '', parameter_depth: '', ...record });
    setEditingKey(record.key);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (key: React.Key) => {
    try {
      const row = (await form.validateFields()) as ProviderParameter;

      const newData = [...data];
      const index = newData.findIndex((item) => key === item.key);
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, {
          ...item,
          ...row,
        });
        setData(newData);
        setEditingKey('');
      } else {
        newData.push(row);
        setData(newData);
        setEditingKey('');
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

  const handleDelete = (key: React.Key) => {
    const newData = data.filter((item) => item.key !== key);
    setData(newData);
  };

  const getMaxKey = () => {
    return data.length > 0 ? Math.max(...data.map((item) => parseInt(item.key, 10))) : 0;
  }

  const addParameter = () => {
    const newData = [...data];
    newData.push({
      key: (getMaxKey() + 1).toString(),
      parameter_name: '',
      standard_name: '',
      parameter_depth: 0.0,
    });
    setData(newData);
  }


  const parameterTableColumns = [
    {
      title: 'Incoming Name',
      dataIndex: 'parameter_name',
      key: 'parameterName',
      editable: true,
    },
    {
      title: 'Standard Name',
      dataIndex: 'standard_name',
      key: 'standardName',
      editable: true,
    },
    {
      title: 'Depth',
      dataIndex: 'parameter_depth',
      key: 'parameterDepth',
      editable: true,
    },
    {
      title: 'operation',
      dataIndex: 'operation',
      render: (_: any, record: ProviderParameter) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <Typography.Link onClick={() => parameterRecommendTrigger(currStdName)} style={{ marginRight: 8, marginLeft: 8 }}>
              Standard Name rec?
            </Typography.Link> {' | '}
            <Typography.Link onClick={() => save(record.key)} style={{ marginRight: 8, marginLeft: 8 }}>
              Save
            </Typography.Link> {' | '}
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <a> Cancel</a>
            </Popconfirm>
          </span>
        ) : (
          <span>
            <Typography.Link disabled={editingKey !== ''} onClick={() => edit(record)}>
              Edit
            </Typography.Link>
            {
              data.length >= 1 ? (
                <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record.key)}>
                {' '} <a>Delete</a>
                </Popconfirm>
              ) : null
            }
          </span>
        );
      },
    },
  ];
  
  const mergedColumns: TableProps['columns'] = parameterTableColumns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: ProviderParameter) => ({
        record,
        inputType: col.dataIndex === 'parameter_depth' ? 'number' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  const onSubmit: SubmitHandler<Inputs> = (submitData) => {
    console.log('submitData');
    console.log(submitData)
    console.log('param data');
    console.log(data);
    const submissionData = {
      ...submitData,
      platform_parameters: data,
    };
    console.log('submissionData');
    console.log(submissionData);
    
  }

  const onFinish: FormProps<Inputs>['onFinish'] = (values) => {
    console.log('Success:', values);
    const submissionData = {
      ...values,
      platform_parameters: data,
    };
    console.log('submissionData');
    console.log(submissionData);
  };
  
  const onFinishFailed: FormProps<Inputs>['onFinishFailed'] = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };
  
  // const [platformParameters, setPlatformParameters] = useState(defaultPlatformParameters);

  console.log(watch("example")) // watch input value by passing the name of it

  const summaryDefault = "Hodor. Hodor hodor, hodor. Hodor hodor hodor hodor hodor. Hodor. Hodor! Hodor hodor, hodor; hodor hodor hodor. Hodor. Hodor hodor; hodor hodor - hodor, hodor, hodor hodor. Hodor, hodor. Hodor. Hodor, hodor hodor hodor; hodor hodor; hodor hodor hodor! Hodor hodor HODOR! Hodor hodor... Hodor hodor hodor..."

  const handleFormInteraction = (dValues: any, allValues: any) => {
    setCurrStdName(allValues.standard_name);
    console.log(allValues);
  }

  return (
    <div className="App">
      <h1>Provider Platform Form</h1>
      <Form 
        form={form} 
        onFinish={onFinish} 
        onFinishFailed={onFinishFailed}
        onValuesChange={(dValues, allValues) => handleFormInteraction(dValues, allValues)}
        initialValues={{ remember: true }}
      >
        <h2>Organization details</h2>
        {/* register your input into the hook by invoking the "register" function */}
        <h3>Organization Name</h3>
        <Form.Item name="orgName" initialValue="GLOS">
          <Input />
        </Form.Item>

        <h4>Organization Description</h4>
        <Form.Item name="orgDesc" initialValue="Great Lakes Observing System">
          <Input />
        </Form.Item>

        <h4>Organization URL</h4>
        <Form.Item name="orgUrl" initialValue="glos.org">
          <Input />
        </Form.Item>

        <h3>Organization Contact Info</h3>

        <h4>Creator Country</h4>
        <Form.Item name="creatorCountry" initialValue="USA">
          <Input />
        </Form.Item>

        <h4>Creator Email</h4>
        <Form.Item name="creatorEmail" initialValue="joe@glos.org">
          <Input />
        </Form.Item>

        <h4>Creator Institution</h4>
        <Form.Item name="creatorInst" initialValue="University of Michigan">
          <Input />
        </Form.Item>

        <h4>Creator Type</h4>
        <Form.Item name="creatorType" initialValue="institution">
          <Input />
        </Form.Item>

        <h4>Creator Sector</h4>
        <Form.Item name="creatorSector" initialValue="gov_federal">
          <Input />
        </Form.Item>

        <h2>New Platform Details</h2>
        <h3>Identification</h3>

        <h4>Platform ID</h4>
        <Form.Item name="orgPlatformId" initialValue="99999">
          <Input />
        </Form.Item>

        <h4>Platform Name</h4>
        <Form.Item name="platformName" initialValue="Code Sprint Finish Demo Platform">
          <Input />
        </Form.Item>

        <h4>Platform Type</h4>
        <Form.Item name="platformType" initialValue="tower">
          <Input />
        </Form.Item>

        <h4>Resulting Dataset Type</h4>
        <Form.Item name="dataSetType" initialValue="deployment_site">
          <Input />
        </Form.Item>
        
        <h3>Location</h3>

        <h4>Latitude</h4>
        <Form.Item name="latitude" initialValue="42.3601">
          <Input />
        </Form.Item>

        <h4>Longitude</h4>
        <Form.Item name="longitude" initialValue="-83.0964">
          <Input />
        </Form.Item>

        <h2>Metadata</h2>

        <h4>Dataset Information URL</h4>
        <Form.Item name="dataSetInfoURL" initialValue="https://glos.org/dataset/99999">
          <Input />
        </Form.Item>

        <h4>Dataset Summary</h4>
        <Form.Item name="dataSetSummary" initialValue={summaryDefault}>
          <Input />
        </Form.Item>

        <h4>Dataset Title</h4>
        <Form.Item name="dataSetTitle" initialValue="Code Sprint Finish Demo Platform">
          <Input />
        </Form.Item>

        <h4>Dataset WMO Platform Code</h4>
        <Form.Item name="dataSetWmoPlatformCode" initialValue="99999">
          <Input />
        </Form.Item>

        <h4>Dataset NDBC ID</h4>
        <Form.Item name="dataSetNcdbId" initialValue="99999">
          <Input />
        </Form.Item>
        <Form.Item name="dataSetNcdbSharing">
          NDBC Sharing? <Checkbox />
        </Form.Item>

        <h2>Parameters</h2>

        <h3>Surface, Non-depth-profile Parameters</h3>

        <Table
          components={{
            body: {
              cell: EditableCell,
            },
          }}
          bordered
          dataSource={data}
          columns={mergedColumns}
          rowClassName="editable-row"
          pagination={{
            onChange: cancel,
          }}
        />
        <Button type="primary" onClick={ () => addParameter() }>Add Parameter</Button>
        {
          showRecommendedParameters && (
            <Table
              columns={RecommendedParameterColumns}
              expandable={{
                expandedRowRender: (record) => <p style={{ margin: 0 }}>{record.description}</p>,
                rowExpandable: (record) => record.description !== '',
              }}
              dataSource={recommendedParameters}
            />
          )
        }

        <Button type="primary" htmlType="submit">Submit</Button>
      </Form>
      
    </div>
  );
}

export default App;
