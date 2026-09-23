export interface WeatherLocation {
  id?: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  countryCode?: string;
  admin1?: string;
  timezone?: string;
}

export interface WeatherCurrent {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  isDay: boolean;
  condition: string;
}

export interface WeatherForecastDay {
  date: string;
  max: number;
  min: number;
  weatherCode: number;
  precipitationProbability: number;
  sunrise: string;
  sunset: string;
  condition: string;
}

export interface WeatherHourly {
  time: string;
  temperature: number;
  weatherCode: number;
  precipitationProbability: number;
  isDay: boolean;
  condition: string;
}

export interface WeatherData {
  location: WeatherLocation;
  timezone: string;
  current: WeatherCurrent;
  daily: WeatherForecastDay[];
  hourly: WeatherHourly[];
  fetchedAt: number;
}

export interface WeatherVisual {
  kind:
    | 'clear'
    | 'partly-cloudy'
    | 'cloud'
    | 'fog'
    | 'rain'
    | 'snow'
    | 'storm';

  icon:
    | 'sun'
    | 'cloud'
    | 'cloud-sun'
    | 'rain'
    | 'snow'
    | 'storm';

  condition: string;
}

const GEOCODING_API =
  'https://geocoding-api.open-meteo.com/v1/search';

const WEATHER_API =
  'https://api.open-meteo.com/v1/forecast';

export async function searchLocations(
  query: string
): Promise<WeatherLocation[]> {
  const value = query.trim();

  if (!value) {
    return [];
  }

  const url = new URL(GEOCODING_API);

  url.searchParams.set('name', value);
  url.searchParams.set('count', '8');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error('Location search failed');
  }

  const data = await response.json();

  return (data.results || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    latitude: item.latitude,
    longitude: item.longitude,
    country: item.country,
    countryCode: item.country_code,
    admin1: item.admin1,
    timezone: item.timezone,
  }));
}

export function getWeatherCondition(
  code: number
): string {
  if (code === 0) return 'Clear Sky';

  if (code === 1) return 'Mainly Clear';

  if (code === 2) return 'Partly Cloudy';

  if (code === 3) return 'Overcast';

  if (code === 45 || code === 48) {
    return 'Foggy';
  }

  if (code >= 51 && code <= 57) {
    return 'Drizzle';
  }

  if (code >= 61 && code <= 67) {
    return 'Rain';
  }

  if (code >= 71 && code <= 77) {
    return 'Snow';
  }

  if (code >= 80 && code <= 82) {
    return 'Rain Showers';
  }

  if (code === 85 || code === 86) {
    return 'Snow Showers';
  }

  if (code >= 95 && code <= 99) {
    return 'Thunderstorm';
  }

  return 'Unknown';
}

export function getWeatherVisual(
  code: number,
  isDay: boolean
): WeatherVisual {
  if (code === 0) {
    return {
      kind: 'clear',
      icon: 'sun',
      condition: isDay
        ? 'Clear Sky'
        : 'Clear Night',
    };
  }

  if (code === 1 || code === 2) {
    return {
      kind: 'partly-cloudy',
      icon: 'cloud-sun',
      condition: getWeatherCondition(code),
    };
  }

  if (code === 3) {
    return {
      kind: 'cloud',
      icon: 'cloud',
      condition: 'Overcast',
    };
  }

  if (code === 45 || code === 48) {
    return {
      kind: 'fog',
      icon: 'cloud',
      condition: 'Foggy',
    };
  }

  if (code >= 51 && code <= 67) {
    return {
      kind: 'rain',
      icon: 'rain',
      condition: getWeatherCondition(code),
    };
  }

  if (code >= 71 && code <= 86) {
    return {
      kind: 'snow',
      icon: 'snow',
      condition: getWeatherCondition(code),
    };
  }

  if (code >= 95 && code <= 99) {
    return {
      kind: 'storm',
      icon: 'storm',
      condition: 'Thunderstorm',
    };
  }

  return {
    kind: 'cloud',
    icon: 'cloud',
    condition: getWeatherCondition(code),
  };
}

export async function fetchWeather(
  latitude: number,
  longitude: number,
  location?: Partial<WeatherLocation>
): Promise<WeatherData> {
  const url = new URL(WEATHER_API);

  url.searchParams.set(
    'latitude',
    String(latitude)
  );

  url.searchParams.set(
    'longitude',
    String(longitude)
  );

  url.searchParams.set(
    'current',
    [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'is_day',
    ].join(',')
  );

  url.searchParams.set(
    'hourly',
    [
      'temperature_2m',
      'weather_code',
      'precipitation_probability',
      'is_day',
    ].join(',')
  );

  url.searchParams.set(
    'daily',
    [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'sunrise',
      'sunset',
    ].join(',')
  );

  url.searchParams.set(
    'forecast_days',
    '7'
  );

  url.searchParams.set(
    'timezone',
    'auto'
  );

  const response = await fetch(
    url.toString()
  );

  if (!response.ok) {
    throw new Error('Weather request failed');
  }

  const data = await response.json();

  const currentCode =
    Number(data.current.weather_code);

  const currentIsDay =
    Boolean(data.current.is_day);

  const hourly: WeatherHourly[] =
    (data.hourly?.time || []).map(
      (time: string, index: number) => ({
        time,

        temperature:
          Number(
            data.hourly.temperature_2m[index]
          ),

        weatherCode:
          Number(
            data.hourly.weather_code[index]
          ),

        precipitationProbability:
          Number(
            data.hourly
              .precipitation_probability?.[
              index
            ] ?? 0
          ),

        isDay:
          Boolean(
            data.hourly.is_day?.[index]
          ),

        condition:
          getWeatherCondition(
            Number(
              data.hourly.weather_code[
                index
              ]
            )
          ),
      })
    );

  const daily: WeatherForecastDay[] =
    (data.daily?.time || []).map(
      (date: string, index: number) => ({
        date,

        max:
          Number(
            data.daily.temperature_2m_max[
              index
            ]
          ),

        min:
          Number(
            data.daily.temperature_2m_min[
              index
            ]
          ),

        weatherCode:
          Number(
            data.daily.weather_code[index]
          ),

        precipitationProbability:
          Number(
            data.daily
              .precipitation_probability_max?.[
              index
            ] ?? 0
          ),

        sunrise:
          data.daily.sunrise[index],

        sunset:
          data.daily.sunset[index],

        condition:
          getWeatherCondition(
            Number(
              data.daily.weather_code[
                index
              ]
            )
          ),
      })
    );

  return {
    location: {
      name:
        location?.name ||
        'Your Location',

      latitude,
      longitude,

      country:
        location?.country || '',

      countryCode:
        location?.countryCode,

      admin1:
        location?.admin1,

      timezone:
        location?.timezone ||
        data.timezone,
    },

    timezone: data.timezone,

    current: {
      temperature:
        Number(
          data.current.temperature_2m
        ),

      apparentTemperature:
        Number(
          data.current.apparent_temperature
        ),

      humidity:
        Number(
          data.current
            .relative_humidity_2m
        ),

      precipitation:
        Number(
          data.current.precipitation
        ),

      weatherCode:
        currentCode,

      windSpeed:
        Number(
          data.current.wind_speed_10m
        ),

      windDirection:
        Number(
          data.current.wind_direction_10m
        ),

      isDay:
        currentIsDay,

      condition:
        getWeatherCondition(
          currentCode
        ),
    },

    daily,

    hourly,

    fetchedAt: Date.now(),
  };
}