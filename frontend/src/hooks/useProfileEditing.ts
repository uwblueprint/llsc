import { useState } from 'react';
import { updateUserData } from '@/APIClients/authAPIClient';
import { UserResponse } from '@/types/userTypes';
import {
  ProfileEditData,
  CancerEditData,
  LovedOneEditData,
  SaveMessage,
} from '@/types/userProfileTypes';

interface UseProfileEditingProps {
  userId: string | string[] | undefined;
  user: UserResponse | null;
  setUser: (user: UserResponse) => void;
  setSaveMessage: (message: SaveMessage | null) => void;
}

export function useProfileEditing({
  userId,
  user,
  setUser,
  setSaveMessage,
}: UseProfileEditingProps) {
  const [isEditingProfileSummary, setIsEditingProfileSummary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileEditData, setProfileEditData] = useState<ProfileEditData>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [cancerEditData, setCancerEditData] = useState<CancerEditData>({});
  const [lovedOneEditData, setLovedOneEditData] = useState<LovedOneEditData>({});

  const userData = user?.userData;

  const handleStartEditProfileSummary = () => {
    if (userData) {
      setProfileEditData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        dateOfBirth: userData.dateOfBirth || '',
        phone: userData.phone || '',
        genderIdentity: userData.genderIdentity || '',
        pronouns: userData.pronouns || [],
        timezone: userData.timezone || '',
        ethnicGroup: userData.ethnicGroup || [],
        maritalStatus: userData.maritalStatus || '',
        hasKids: userData.hasKids || '',
        lovedOneGenderIdentity: userData.lovedOneGenderIdentity || '',
        lovedOneAge: userData.lovedOneAge || '',
      });
    }
    setIsEditingProfileSummary(true);
  };

  const handleSaveProfileSummary = async () => {
    if (!userId || !user) return;

    setIsSaving(true);
    try {
      const updatedUser = await updateUserData(userId as string, {
        firstName: profileEditData.firstName,
        lastName: profileEditData.lastName,
        dateOfBirth: profileEditData.dateOfBirth,
        phone: profileEditData.phone,
        genderIdentity: profileEditData.genderIdentity,
        pronouns: profileEditData.pronouns,
        timezone: profileEditData.timezone,
        ethnicGroup: profileEditData.ethnicGroup,
        maritalStatus: profileEditData.maritalStatus,
        hasKids: profileEditData.hasKids,
        lovedOneGenderIdentity: profileEditData.lovedOneGenderIdentity,
        lovedOneAge: profileEditData.lovedOneAge,
      });

      setUser(updatedUser);
      setIsEditingProfileSummary(false);
      setSaveMessage({ type: 'success', text: 'Profile summary updated successfully' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setSaveMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEditProfileSummary = () => {
    setIsEditingProfileSummary(false);
    setProfileEditData({});
  };

  const handleStartEditField = (fieldName: string, isLovedOne: boolean = false) => {
    if (isLovedOne) {
      const currentData = userData;
      setLovedOneEditData({
        diagnosis: currentData?.lovedOneDiagnosis || '',
        dateOfDiagnosis: currentData?.lovedOneDateOfDiagnosis || '',
        treatments: currentData?.lovedOneTreatments?.map((t) => t.name) || [],
        experiences: currentData?.lovedOneExperiences?.map((e) => e.name) || [],
      });
    } else {
      const currentData = userData;
      setCancerEditData({
        diagnosis: currentData?.diagnosis || '',
        dateOfDiagnosis: currentData?.dateOfDiagnosis || '',
        treatments: currentData?.treatments?.map((t) => t.name) || [],
        experiences: currentData?.experiences?.map((e) => e.name) || [],
        additionalInfo: currentData?.additionalInfo || '',
      });
    }
    setEditingField(fieldName);
  };

  const handleCancelEditField = () => {
    setEditingField(null);
    setCancerEditData({});
    setLovedOneEditData({});
  };

  const handleSaveField = async (fieldName: string, isLovedOne: boolean = false) => {
    if (!userId || !user) return;

    setIsSaving(true);
    try {
      const updateData: Record<string, unknown> = {};

      if (isLovedOne) {
        if (fieldName === 'diagnosis' || fieldName === 'lovedOneDiagnosis')
          updateData.lovedOneDiagnosis = lovedOneEditData.diagnosis;
        if (fieldName === 'dateOfDiagnosis' || fieldName === 'lovedOneDateOfDiagnosis') {
          updateData.lovedOneDateOfDiagnosis =
            lovedOneEditData.dateOfDiagnosis && lovedOneEditData.dateOfDiagnosis.trim() !== ''
              ? lovedOneEditData.dateOfDiagnosis
              : null;
        }
        if (fieldName === 'treatments' || fieldName === 'lovedOneTreatments')
          updateData.lovedOneTreatments = lovedOneEditData.treatments;
        if (fieldName === 'experiences' || fieldName === 'lovedOneExperiences')
          updateData.lovedOneExperiences = lovedOneEditData.experiences;
      } else {
        if (fieldName === 'diagnosis') updateData.diagnosis = cancerEditData.diagnosis;
        if (fieldName === 'dateOfDiagnosis') {
          updateData.dateOfDiagnosis =
            cancerEditData.dateOfDiagnosis && cancerEditData.dateOfDiagnosis.trim() !== ''
              ? cancerEditData.dateOfDiagnosis
              : null;
        }
        if (fieldName === 'treatments') updateData.treatments = cancerEditData.treatments;
        if (fieldName === 'experiences') updateData.experiences = cancerEditData.experiences;
        if (fieldName === 'additionalInfo')
          updateData.additionalInfo = cancerEditData.additionalInfo;
      }

      const updatedUser = await updateUserData(userId as string, updateData);
      setUser(updatedUser);
      setEditingField(null);
      setCancerEditData({});
      setLovedOneEditData({});
      setSaveMessage({ type: 'success', text: 'Field updated successfully' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to update field:', error);
      setSaveMessage({ type: 'error', text: 'Failed to update field. Please try again.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isEditingProfileSummary,
    isSaving,
    profileEditData,
    setProfileEditData,
    editingField,
    cancerEditData,
    setCancerEditData,
    lovedOneEditData,
    setLovedOneEditData,
    handleStartEditProfileSummary,
    handleSaveProfileSummary,
    handleCancelEditProfileSummary,
    handleStartEditField,
    handleCancelEditField,
    handleSaveField,
  };
}
