export default theme => ({
  paper: {
    marginTop: theme.spacing(8),
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main
  },
  form: {
    width: "100%", // Fix IE 11 issue.
    marginTop: theme.spacing(3)
  },
  submit: {
    margin: theme.spacing(3, 0, 2)
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    display: "flex"
  },
  formControl: {
    margin: theme.spacing(0),
    minWidth: 120
  },
  error: {
    color: "red",
    fontSize: "small"
  }
});