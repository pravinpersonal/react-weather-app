import { Col, Row } from 'antd';
import * as moment from 'moment';
import * as React from 'react';
import { Timezone, Weather } from './DataModel';
import { WeatherIcon } from './icon/WeatherIcon';
import { WindIcon } from './icon/WindIcon';

interface CurrentWeatherPropTypes {
	weather: Weather
	location: string
	timezone: Timezone,
	units: string
}

export class CurrentWeather extends React.Component<CurrentWeatherPropTypes, any> {
	render() {
		const { weather, location, timezone, units } = this.props;
		//TODO

		return (
			<div>
				<Row type="flex" justify="center"
				     style={{ background: '#FAFAFA', fontSize: '0.8rem', padding: '0.5rem 0' }}>
					<Col span={2}>
						Wind: {weather.windSpeed} {units === 'us' ? 'mph' : 'kph'}
						<WindIcon degree={weather.windBearing}/>
					</Col>
					<Col span={2}>Humidity: {weather.humidity * 100}%</Col>
					<Col span={2}>Dew Point: {weather.dewPoint}{units === 'us' ? '℉' : '℃'}</Col>
					<Col span={2}>Pressure: {Math.round(weather.pressure)} {units === 'us' ? 'mb' : 'hPa'}</Col>
					<Col span={2}>UV Index: {weather.uvIndex}</Col>
					<Col span={2}>Visibility: {Math.round(weather.visibility)} {units === 'us' ? 'mi' : 'km'}</Col>
				</Row>
				<Row type="flex" justify="center" style={{ fontSize: '2rem' }}>
					{location}
				</Row>
				<Row type="flex" justify="center">
					<Col span={1} style={{ fontSize: '3rem' }}>
						<WeatherIcon icon={weather.icon}/>
					</Col>
					<Col span={3}>
						<div>{moment.unix(weather.time).utcOffset(timezone.offset).format('YYYY-MM-DD HH:mm')}</div>
						<div>{weather.summary} {weather.temperature}{units === 'us' ? '℉' : '℃'}</div>
						<div style={{ fontSize: '0.8rem' }}>Feels
							like {weather.apparentTemperature}{units === 'us' ? '℉' : '℃'}</div>
					</Col>
				</Row>
			</div>
		);
	}
}