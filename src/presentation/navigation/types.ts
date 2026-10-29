export type RootTabParamList = {
  Home: undefined;
  Plans: undefined;
  CreatePlan: undefined;
  Stats: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: { screen?: keyof RootTabParamList } | undefined;
  Achievements: undefined;
  EditPlan: { planId: string };
  PlanOverview: { planId: string };
  PlanStats: { planId: string };
  Settings: undefined;
};
