import React, { Component } from "react";
import {
  Grid,
  Typography,
  withStyles,
  TextField,
  Icon,
  Box,
} from "@material-ui/core";
import MUIPlacesAutocomplete from "mui-places-autocomplete";
import GoogleMapReact from "google-map-react";
import PropTypes from "prop-types";
import addressStyles from "../../../../../../styles/User/Dashboard/components/NewOrder/components/addressStyles";

const apiKEY =
  process.env.GOOGLE_MAPS_API_KEY ||
  require("../../../../../../config").google.mapsKEY;

const Marker = () => (
  <div>
    <Icon
      style={{
        textAlign: "center",
        transform: "translate(-50%, -50%)",
        position: "absolute",
      }}
    >
      <img
        alt="Marker"
        style={{ height: "100%" }}
        src="/images/NewOrder/Marker.png"
      />
    </Icon>
  </div>
);

class Address extends Component {
  state = { charCount: 0 };

  renderMarker = () => {
    const { renderMarker, marketLat, markerLong } = this.props;

    if (renderMarker) {
      return <Marker lat={marketLat} lng={markerLong} />;
    }
  };

  handleCharCount = (text) => {
    let limit = 200;
    let count;

    if (text.length > limit) {
      count = 200;
    } else {
      count = text.length;
    }

    this.setState({ charCount: count });
  };

  render() {
    const {
      classes,
      center,
      zoom,
      handleInputChange,
      handleAddressSelect,
      addressPreferences,
      address,
    } = this.props;

    return (
      <React.Fragment>
        <Typography component="h1" variant="h6" gutterBottom>
          What's your address?
        </Typography>
        <Box
          bgcolor="background.paper"
          borderColor="grey.400"
          border={1}
          style={{ marginBottom: 20 }}
        >
          <div style={{ height: "40vh", width: "100%" }}>
            <GoogleMapReact
              bootstrapURLKeys={{
                key: apiKEY,
              }}
              center={center}
              zoom={zoom}
              onChange={(properties) => {
                handleInputChange("map", properties);
              }}
            >
              {this.renderMarker()}
            </GoogleMapReact>
          </div>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <div style={{ position: "relative" }}>
              {/* <MUIPlacesAutocomplete
                onSuggestionSelected={(suggestion) =>
                  handleAddressSelect(suggestion)
                }
                renderTarget={() => (
                  <React.Fragment>
                    <Typography
                      component="h1"
                      variant="h6"
                      gutterBottom
                      className={classes.title}
                    >
                      Do you have any special instructions for our drivers? (ex:
                      building number, unit, directions, etc.)
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          label="Special Instructions"
                          fullWidth
                          multiline
                          variant="outlined"
                          helperText={`${this.state.charCount}/200`}
                          value={addressPreferences}
                          onChange={(event) => {
                            handleInputChange(
                              "addressPreferences",
                              event.target.value
                            );
                            this.handleCharCount(event.target.value);
                          }}
                        />
                      </Grid>
                    </Grid>
                  </React.Fragment>
                )}
                textFieldProps={{
                  fullWidth: true,
                  variant: "outlined",
                  label: "Search for an address",
                  value: address,
                  onChange: (event) =>
                    handleInputChange("address", event.target.value),
                }}
              /> */}
            </div>
          </Grid>
        </Grid>
      </React.Fragment>
    );
  }
}

Address.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(addressStyles)(Address);
