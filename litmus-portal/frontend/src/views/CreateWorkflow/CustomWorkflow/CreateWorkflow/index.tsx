import { useLazyQuery, useQuery } from '@apollo/client';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import BackButton from '../../../../components/Button/BackButton';
import ButtonFilled from '../../../../components/Button/ButtonFilled';
import InputField from '../../../../components/InputField';
import Loader from '../../../../components/Loader';
import { GET_CHARTS_DATA, GET_HUB_STATUS } from '../../../../graphql';
import { MyHubDetail } from '../../../../models/graphql/user';
import { Chart, Charts, HubStatus } from '../../../../models/redux/myhub';
import * as WorkflowActions from '../../../../redux/actions/workflow';
import useActions from '../../../../redux/actions';
import { RootState } from '../../../../redux/reducers';
import useStyles, { CustomTextField, MenuProps } from './styles';
import WorkflowDetails from '../../../../pages/WorkflowDetails';

interface WorkflowDetails {
  workflow_name: string;
  workflow_desc: string;
}

interface ChartName {
  ChaosName: string;
  ExperimentName: string;
}

interface VerifyCommitProps {
  gotoStep: (page: number) => void;
}

const CreateWorkflow: React.FC<VerifyCommitProps> = ({ gotoStep }) => {
  const userData = useSelector((state: RootState) => state.userData);
  const hubData = useSelector((state: RootState) => state.publicHubDetails);
  const workflowDetails = useSelector((state: RootState) => state.workflowData);
  const workflowAction = useActions(WorkflowActions);
  const [workflowData, setWorkflowData] = useState<WorkflowDetails>({
    workflow_name: workflowDetails.name,
    workflow_desc: workflowDetails.description,
  });
  const { t } = useTranslation();
  const classes = useStyles();
  const [allExperiment, setAllExperiment] = useState<ChartName[]>([]);
  const [selectedHub, setSelectedHub] = useState('Public Hub');
  const [selectedExp, setSelectedExp] = useState('Select');
  const allExp: ChartName[] = [];
  const [selectedHubDetails, setSelectedHubDetails] = useState<MyHubDetail>();
  // Get all MyHubs with status
  const { data } = useQuery<HubStatus>(GET_HUB_STATUS, {
    variables: { data: userData.username },
    fetchPolicy: 'cache-and-network',
  });
  // Graphql query to get charts
  const [getCharts, { loading: chartsLoading }] = useLazyQuery<Charts>(
    GET_CHARTS_DATA,
    {
      onCompleted: (data) => {
        data.getCharts.forEach((data) => {
          return data.Spec.Experiments?.forEach((experiment) => {
            allExp.push({
              ChaosName: data.Metadata.Name,
              ExperimentName: experiment,
            });
          });
        });
        setAllExperiment(allExp);
      },
      fetchPolicy: 'cache-and-network',
    }
  );
  // Function to get charts of a particular hub
  const findChart = (hubname: string) => {
    const myHubData = data?.getHubStatus.filter((myHub) => {
      return hubname === myHub.HubName;
    })[0];
    getCharts({
      variables: {
        data: {
          UserName: userData.username,
          RepoURL: myHubData?.RepoURL,
          RepoBranch: myHubData?.RepoBranch,
          HubName: hubname,
        },
      },
    });
    setSelectedHubDetails(myHubData);
    workflowAction.setWorkflowDetails({
      customWorkflow: {
        ...workflowDetails.customWorkflow,
        hubName: hubname,
        repoUrl: myHubData?.RepoURL,
        repoBranch: myHubData?.RepoBranch,
      },
    });
  };

  useEffect(() => {
    if (selectedHub === 'Public Hub') {
      setSelectedHub('Public Hub');
      const ChartsData = hubData.charts;
      ChartsData.forEach((data: Chart) => {
        if (data.Spec.Experiments) {
          data.Spec.Experiments.forEach((experiment) => {
            allExp.push({
              ChaosName: data.Metadata.Name,
              ExperimentName: experiment,
            });
          });
        }
      });
      setAllExperiment([...allExp]);
      workflowAction.setWorkflowDetails({
        customWorkflow: {
          ...workflowDetails.customWorkflow,
          hubName: 'Public Hub',
          repoUrl: 'https://github.com/litmuschaos/chaos-charts',
          repoBranch: 'master',
        },
      });
    } else {
      setAllExperiment([]);
    }
  }, [selectedHub]);
  const availableHubs: MyHubDetail[] = data ? data.getHubStatus : [];

  return (
    <div className={classes.root}>
      <div className={classes.headerDiv}>
        <BackButton isDisabled={false} />
        <Typography variant="h3" className={classes.headerText} gutterBottom>
          {t('customWorkflow.createWorkflow.create')}
        </Typography>
        <Typography className={classes.headerDesc}>
          {t('customWorkflow.createWorkflow.createDesc')}
        </Typography>
      </div>
      <div className={classes.workflowDiv}>
        <Typography variant="h4">
          <strong> {t('customWorkflow.createWorkflow.workflowInfo')}</strong>
        </Typography>
        <div>
          <div className={classes.inputDiv}>
            <Typography variant="h6" className={classes.titleText}>
              {t('customWorkflow.createWorkflow.workflowName')}:
            </Typography>
            <InputField
              label="Workflow Name"
              styles={{
                width: '100%',
              }}
              data-cy="inputWorkflow"
              validationError={false}
              handleChange={(e) => {
                setWorkflowData({
                  workflow_name: e.target.value,
                  workflow_desc: workflowData.workflow_desc,
                });
              }}
              value={workflowData.workflow_name}
            />
          </div>
          <div className={classes.inputDiv}>
            <Typography variant="h6" className={classes.titleText}>
              {t('customWorkflow.createWorkflow.workflowDesc')}:
            </Typography>
            <CustomTextField
              label="Description"
              data-cy="inputWorkflow"
              InputProps={{
                disableUnderline: true,
                classes: {
                  input: classes.resize,
                },
              }}
              onChange={(e) => {
                setWorkflowData({
                  workflow_name: workflowData.workflow_name,
                  workflow_desc: e.target.value,
                });
              }}
              value={workflowData.workflow_desc}
              multiline
              rows={14}
            />
          </div>
          <hr />
          <div className={classes.inputDiv}>
            <Typography variant="h6" className={classes.titleText}>
              {t('customWorkflow.createWorkflow.firstChaos')}
            </Typography>
            <FormControl
              variant="outlined"
              className={classes.formControl}
              color="secondary"
              focused
            >
              <InputLabel className={classes.selectText}>
                {t('customWorkflow.createWorkflow.selectHub')}
              </InputLabel>
              <Select
                value={selectedHub}
                onChange={(e) => {
                  setSelectedHub(e.target.value as string);
                  if (e.target.value !== 'Public Hub') {
                    findChart(e.target.value as string);
                  }
                }}
                label="Cluster Status"
                MenuProps={MenuProps}
                className={classes.selectText}
              >
                <MenuItem value="Public Hub">
                  {t('customWorkflow.createWorkflow.public')}
                </MenuItem>
                {availableHubs.map((hubs) => (
                  <MenuItem key={hubs.HubName} value={hubs.HubName}>
                    {hubs.HubName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <div className={classes.inputDiv}>
            <Typography variant="h6" className={classes.titleText}>
              {t('customWorkflow.createWorkflow.chooseExp')}
            </Typography>
            {chartsLoading ? (
              <div className={classes.chooseExpDiv}>
                <Loader />
                <Typography variant="body2">
                  {t('customWorkflow.createWorkflow.loadingExp')}
                </Typography>
              </div>
            ) : (
              <FormControl
                variant="outlined"
                className={classes.formControl}
                color="secondary"
                focused
              >
                <InputLabel className={classes.selectText1}>
                  {t('customWorkflow.createWorkflow.selectExp')}
                </InputLabel>
                <Select
                  value={selectedExp}
                  onChange={(e) => {
                    setSelectedExp(e.target.value as string);
                    if (selectedHub === 'Public Hub') {
                      workflowAction.setWorkflowDetails({
                        customWorkflow: {
                          ...workflowDetails.customWorkflow,
                          experiment_name: e.target.value,
                          yamlLink: `${workflowDetails.customWorkflow.repoUrl}/raw/${workflowDetails.customWorkflow.repoBranch}/charts/${e.target.value}/engine.yaml`,
                        },
                      });
                    } else {
                      workflowAction.setWorkflowDetails({
                        customWorkflow: {
                          ...workflowDetails.customWorkflow,
                          experiment_name: e.target.value,
                          yamlLink: `${selectedHubDetails?.RepoURL}/raw/${selectedHubDetails?.RepoBranch}/charts/${e.target.value}/engine.yaml`,
                        },
                      });
                    }
                  }}
                  label="Cluster Status"
                  MenuProps={MenuProps}
                  className={classes.selectText}
                >
                  <MenuItem value="Select">
                    {t('customWorkflow.createWorkflow.selectAnExp')}
                  </MenuItem>
                  {allExperiment.map((exp) => (
                    <MenuItem
                      key={`${exp.ChaosName}/${exp.ExperimentName}`}
                      value={`${exp.ChaosName}/${exp.ExperimentName}`}
                    >
                      {exp.ExperimentName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </div>
        </div>
      </div>
      <div className={classes.nextButtonDiv}>
        <ButtonFilled
          handleClick={() => {
            workflowAction.setWorkflowDetails({
              name: workflowData.workflow_name,
              description: workflowData.workflow_desc,
              customWorkflow: {
                ...workflowDetails.customWorkflow,
                yaml: '',
                index: -1,
              },
            });
            gotoStep(1);
          }}
          isPrimary
          isDisabled={selectedExp === 'Select'}
        >
          <div>
            {t('customWorkflow.createWorkflow.nextBtn')}
            <img
              alt="next"
              src="/icons/nextArrow.svg"
              className={classes.nextArrow}
            />
          </div>
        </ButtonFilled>
      </div>
    </div>
  );
};
export default CreateWorkflow;
