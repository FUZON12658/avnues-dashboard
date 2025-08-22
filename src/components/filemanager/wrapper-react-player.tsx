import ReactPlayer from "react-player";

const WrapperReactPlayer = ({ playerRef, ...props }:any) => {
  return <ReactPlayer ref={playerRef} {...props} />;
};
export default WrapperReactPlayer;
