import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OperatorListScreen from '../screens/Jobs/OperatorListScreen';
import OperatorRegistrationScreen from '../screens/Jobs/OperatorRegistrationScreen';
import FindJobsScreen from '../screens/Jobs/FindJobsScreen';
import JobFiltersScreen from '../screens/Jobs/JobFiltersScreen';
import JobDetailsScreen from '../screens/Jobs/JobDetailsScreen';

export type JobsStackParamList = {
    FindJobs: { filters?: any } | undefined;
    OperatorList: undefined;
    OperatorRegistration: undefined;
    OperatorDetail: { operatorId: string };
    JobFilters: { currentFilters: any };
    JobDetails: { jobId: string };
};

const Stack = createNativeStackNavigator<JobsStackParamList>();

export default function JobsNavigator() {
    return (
        <Stack.Navigator initialRouteName="FindJobs">
            <Stack.Screen
                name="FindJobs"
                component={FindJobsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="JobFilters"
                component={JobFiltersScreen}
                options={{
                    headerShown: false,
                    presentation: 'modal',
                    animation: 'slide_from_bottom'
                }}
            />
            <Stack.Screen
                name="JobDetails"
                component={JobDetailsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="OperatorList"
                component={OperatorListScreen}
                options={{ title: 'Find Operators' }}
            />
            <Stack.Screen
                name="OperatorRegistration"
                component={OperatorRegistrationScreen}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}
