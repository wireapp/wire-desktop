import {settings} from "ConfigurationPersistence";
import {SettingsType} from "SettingsType";

export const setHardwareAccelerationEnabled = (enabled: boolean): void => {
  settings.save(SettingsType.HARDWARE_ACCELERATION_ENABLED, enabled);
  settings.persistToFile();
};

export const isHardwareAccelerationEnabled = (): boolean => {
  return settings.restore(SettingsType.HARDWARE_ACCELERATION_ENABLED, true);
};
