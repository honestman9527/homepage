import { Component, type ReactNode } from 'react';

export class AppBoundary extends Component<{ children: ReactNode; onClose(): void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div className="app-error" role="alert"><h2>这个应用暂时遇到问题。</h2><p>可以重试，或关闭窗口后继续探索桌面。</p><button onClick={() => this.setState({ failed: false })}>重试</button><button onClick={this.props.onClose}>回到桌面</button></div>;
    return this.props.children;
  }
}
