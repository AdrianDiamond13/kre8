import React from 'react';
import { Group } from '@vx/group';
import { Tree } from '@vx/hierarchy';
import { LinkHorizontal, LinkRadial, LinkRadialLine } from '@vx/shape';
import { hierarchy } from 'd3-hierarchy';
import { LinearGradient, RadialGradient } from '@vx/gradient';
import { pointRadial } from 'd3-shape';

import MasterNodeComponent from './MasterNodeComponent';
import WorkerNodeComponent from './WorkerNodeComponent';
import PodComponent from './PodComponent';
import ContainerComponent from './ContainerComponent'

const TreeGraphComponent = (props) => {
  const peach = '#fd9b93';
  const pink = '#fe6e9e';
  const blue = '#03c0dc';
  const green = '#26deb0';
  const plum = '#71248e';
  const lightpurple = '#374469';
  const white = '#ffffff';
  const bg = '#272b4d';


  //masternode
  const HydrogenDark = '#667db6';
  const HydrogenLight = '#0082c8';

  // const HydrogenDark = '#021B79';
  // const HydrogenLight = '#0575E6';

  //worker node
  const darkBlue = '#373B44';
  const lighterBlue = '#4286f4';

  //podGradient
  const coolSkyDark = '#2980B9'
  const coolSkyLight = '#6DD5FA'

  //container
  const waterDark = '#B2FEFA';
  const waterLight = '#B2FEFA';

  //


  const { height, width, treeData, margin } = props;
  const yMax = height - margin.top - margin.bottom;
  const xMax = width - margin.left - margin.right;

  const innerWidth = 2 * Math.PI;
  const innerHeight = Math.min(yMax, xMax) / 2;

  const data = hierarchy(treeData);

  console.log('hierarchy data from the TreeGraphComponent', data);

  return (
    <div className='treegraph_component'>
      <svg width={width} height={height}>
        <RadialGradient id="lg" from={HydrogenDark} to={HydrogenLight} />
        <LinearGradient id="workerNodeGradient" from={darkBlue} to={lighterBlue} />
        <LinearGradient id="podGradient" from={HydrogenDark} to={HydrogenLight} />
        <RadialGradient id="containerGradient" from={coolSkyDark} to={coolSkyLight} />
        <LinearGradient id="podGradient" from={HydrogenDark} to={HydrogenLight} />
        <RadialGradient id="containerGradient" from={coolSkyDark} to={coolSkyLight} />



        <rect width={width} height={height} rx={14} fill={'#232F3E'} />
        <Tree root={data} size={[innerWidth, innerHeight]}>
          {tree => {
            // console.log('tree', tree)
            return (
              <Group top={yMax / 2} left={xMax / 2}>
                {tree.links().map((link, i) => {
                  // console.log('link', link);
                  return (
                    <LinkRadialLine
                      key={`link-${i}`}
                      data={link}
                      stroke={'#3B6F89'}
                      strokeWidth="1"
                      fill="none"
                      // radius={d => d.y}

                    />
                  );
                })}
                {tree.descendants().map((node, i) => {
                  let top;
                  let left;
                  
                  const [radialX, radialY] = pointRadial(node.x, node.y);
                  top = radialY;
                  left = radialX;
  
                  if (node.data.type === 'master') return <MasterNodeComponent showNodeInfo={props.showNodeInfo} node={node} top={top} left={left} key={i}/>
                  if (node.data.type === 'node') return <WorkerNodeComponent showNodeInfo={props.showNodeInfo} node={node} top={top} left={left} key={i} />
                  if (node.data.type === 'pod') return <PodComponent showNodeInfo={props.showNodeInfo} node={node} top={top} left={left} key={i} />
                  if (node.data.type === 'container') return <ContainerComponent showNodeInfo={props.showNodeInfo} node={node} top={top} left={left} key={i} />
                  // if (node.data.type === 'master-component') return <ContainerComponent node={node} top={top} left={left} key={i} />
                })}
              </Group>
            );
          }}
        </Tree>
      </svg>
    </div>
  )
}

export default TreeGraphComponent;