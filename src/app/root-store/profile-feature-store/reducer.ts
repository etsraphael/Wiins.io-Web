import { Actions, ActionTypes } from './actions'
import { initialStateProfile, StateProfile, initialStateProfilePage, StateProfilePage } from './state'

export function featureReducerProfile(state: StateProfile = initialStateProfile, action: Actions) {
  switch (action.type) {
    case ActionTypes.UPDATE_PROFILE_SUCCESS:
    case ActionTypes.GET_PROFILE_SUCCESS: {
      return {
        ...state,
        profile: action.payload,
        isLoading: false,
        error: null
      }
    }
    case ActionTypes.GET_PROFILE_FAIL:
    case ActionTypes.UPDATE_PROFILE_FAIL: {
      return {
        ...state,
        isLoading: false,
        error: action.payload
      }
    }
    case ActionTypes.UPDATE_COVER_SUCCESS: {
      state.profile.picturecover = action.payload
      return state
    }
    case ActionTypes.UPDATE_AVATAR_SUCCESS: {
      state.profile.pictureprofile = action.payload
      return state
    }
    case ActionTypes.UPDATE_GROUP_LEFT: {
      state.profile.adminsPage = state.profile.adminsPage.filter(x => x._id !== action.pageID)
      return state
    }
    case ActionTypes.UPDAT_PROFILE_ACTIF_SPACE: {
      state.profile.actifSpace = action.payload
      return state
    }
    case ActionTypes.ADD_PAGE_PROFILE: {
      state.profile.adminsPage.push(action.page)
      return state
    }
    case ActionTypes.CHANGE_BTN_FOLLOW_SUCCESS: {
      if (typeof action.payload.friend !== 'undefined') state.profile.follow.friend = action.payload.friend
      if (typeof action.payload.following !== 'undefined') state.profile.follow.following = action.payload.following
      return state
    }
    case '@user/log_out' as any: return initialStateProfile
    default: return {...state}
  }
}

export function featureReducerProfilePage(state: StateProfilePage = initialStateProfilePage, action: Actions) {
  switch (action.type) {
    case ActionTypes.GET_PROFILE_BY_PSEUDO_SUCCESS:
    case ActionTypes.GET_PROFILE_BY_ID_SUCCESS:
    case ActionTypes.UPDATE_ASK: {
      return {
        ...state,
        profile: action.payload,
        isLoading: false,
        error: null
      };
    }
    case ActionTypes.DELETE_FRIEND_SUCCESS:
    case ActionTypes.ASK_REJECTED: {
      return {
        ...state,
        profile: {
          ...state.profile,
          relation: 'not-friend'
        },
        isLoading: false,
        error: null
      };
    }
    case ActionTypes.ASK_ACCEPTED: {
      return {
        ...state,
        profile: {
          ...state.profile,
          relation: 'friend'
        },
        isLoading: false,
        error: null
      };
    }
    case ActionTypes.CREATED_ASK: {
      return {
        ...state,
        profile: {
          ...state.profile,
          relation: 'pendingFromMe'
        },
        isLoading: false,
        error: null
      };
    }
    case ActionTypes.FOLLOW_PROFILE_SUCCESS: {
      return {
        ...state,
        profile: {
          ...state.profile,
          relation: 'following'
        }
      }
    }
    case ActionTypes.UNFOLLOW_PROFILE_SUCCESS: {
      return {
        ...state,
        profile: {
          ...state.profile,
          relation: 'nothing'
        }
      }
    }
    case ActionTypes.RESET_PROFILE:
    case '@user/log_out' as any: return initialStateProfilePage
    default: return { ...state }
  }
}
