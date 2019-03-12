import Alert from 'antd/lib/alert';
import Col from 'antd/lib/col';
import Row from 'antd/lib/row';
import Spin from 'antd/lib/spin';

import { isEmpty } from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { getGeocode, getWeather } from '../api';
import {
  fetchingData,
  fetchingDataFailure,
  fetchingDataSuccess,
  setDailyForecast,
  setHourlyForecast,
  setTimestamp,
  setTimezone,
  setUnits,
  setWeather
} from '../redux/actions';
import { Forecast, Timezone } from './data-model';
import { WeatherForecast } from './weather-forecast';

class WeatherMain extends React.Component<any, any> {
  componentDidUpdate(prevProps: any, prevState: any, snapshot: any) {
    // When user search weather by city name
    if (prevProps.location && (this.props.location !== prevProps.location)) {
      this.getWeatherData(0, 0, this.props.location);
    }
    
    // When user change units
    if (this.props.units !== prevProps.units) {
      if (this.props.timezone.latitude && this.props.timezone.longitude) {
        this.props.fetchingData(this.props.location);
        this.getWeatherData(this.props.timezone.latitude, this.props.timezone.longitude, this.props.location);
      } else {
        this.props.fetchingData(this.props.location);
        this.getWeatherData(0, 0, this.props.location);
      }
    }
  }
  
  componentDidMount() {
    if (this.props.location.length === 0 && isEmpty(this.props.weather) && isEmpty(this.props.forecast)) {
      this.props.fetchingData('');
      // Get user's coordinates when user access the web app, it will ask user's location permission
      const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      };
      
      const handleLocation = (location: any) => {
        getGeocode(location.coords.latitude, location.coords.longitude, '').then((geocode: any) => {
          if (geocode.status === 'OK') {
            this.props.fetchingData(geocode.address);
            this.getWeatherData(geocode.latitude, geocode.longitude, geocode.address);
          }
        }).catch(error => {
          this.searchByDefaultLocation(error.message + '. Use default location: Auckland, New Zealand');
        });
      };
      
      const handleError = (error: any) => {
        this.searchByDefaultLocation(error.message + '. Use default location: Auckland, New Zealand');
      };
      
      navigator.geolocation.getCurrentPosition(handleLocation, handleError, options);
    }
  }
  
  render() {
    const {weather, location, isLoading, error} = this.props;
    
    const renderWeatherAndForecast = () => {
      if (error) {
        return (
          <div>
            <Row type='flex' justify='center' className='fetching-weather-content'>
              <Col xs={24} sm={24} md={18} lg={16} xl={16}>
                <Alert
                  message='Error'
                  description={error}
                  type='error'
                  showIcon={true}
                />
              </Col>
            </Row>
          </div>
        );
      } else if (weather && location) {
        return (<WeatherForecast/>);
      }
    };
    
    return (
      <div>
        {isLoading ?
          <Row type='flex' justify='center' className='fetching-weather-content'>
            <h2>Fetching weather</h2>
            <Spin className='fetching-weather-spinner' size='large'/>
          </Row>
          : renderWeatherAndForecast()}
      </div>
    );
  }
  
  /**
   * Only be called when error occurs
   * @param {string} message
   */
  private searchByDefaultLocation(message: string) {
    this.props.fetchingDataFailure(message);
    setTimeout(this.delayFetchWeatherData.bind(this), 5000);
  }
  
  private delayFetchWeatherData() {
    this.props.fetchingData('Auckland');
    this.getWeatherData(0, 0, 'Auckland');
  }
  
  /**
   * If you set lat along with lon, then you must set city name as well, otherwise set (0, 0, city)
   * @param {number} lat
   * @param {number} lon
   * @param {string} city
   */
  private getWeatherData(lat: number, lon: number, city: string) {
    if (lat !== 0 && lon !== 0) {
      // get weather and forecast info by latitude and longitude
      getWeather(lat, lon, 'flags,minutely', this.props.units).then((results: Forecast) => {
        const timezone: Timezone = {
          timezone: results.timezone,
          offset: results.offset,
          latitude: results.latitude,
          longitude: results.longitude
        };
        
        this.setDataToStore(city, timezone, results.currently, results.hourly, results.daily);
      }).catch(error => {
        this.props.fetchingDataFailure(error);
      });
    } else {
      // Get coordinates by city at first, after that get the weather and forecast info by coordinates
      getGeocode(null, null, city).then((geocode: any) => {
        if (geocode.status === 'OK') {
          this.getWeatherData(geocode.latitude, geocode.longitude, geocode.city);
        }
      }).catch(error => {
        this.searchByDefaultLocation(error.message + '. Use default location: Auckland, New Zealand');
      });
    }
  }
  
  /**
   * @param {string} city name
   * @param timezone, the timezone info from the fetched weather result
   * @param weather, the current weather info from the fetched weather result
   * @param hourlyForecast, the hourly forecast info from the fetched weather result
   * @param dailyForecast, the daily forecast info from the fetched weather result
   */
  private setDataToStore(city: string, timezone: any, weather: any, hourlyForecast: any, dailyForecast: any) {
    this.props.setTimezone(timezone);
    this.props.setWeather(weather);
    this.props.setHourlyForecast(hourlyForecast);
    this.props.setDailyForecast(dailyForecast);
    this.props.fetchingDataSuccess();
  }
}

const mapStateToProps = (state: any) => {
  return {
    isLoading: state.isLoading,
    units: state.units,
    location: state.location,
    timestamp: state.timestamp,
    timezone: state.timezone,
    weather: state.weather,
    hourlyForecast: state.hourlyForecast,
    dailyForecast: state.dailyForecast,
    error: state.error
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return bindActionCreators({
    fetchingData,
    fetchingDataSuccess,
    fetchingDataFailure,
    setUnits,
    setTimestamp,
    setTimezone,
    setWeather,
    setHourlyForecast,
    setDailyForecast
  }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(WeatherMain);