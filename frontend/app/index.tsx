import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the tabs layout which will show the home screen
  return <Redirect href="/(tabs)" />;
}
