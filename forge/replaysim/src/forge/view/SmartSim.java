package forge.view;

import forge.GuiDesktop;
import forge.gui.GuiBase;

/** Runs `forge sim` exactly as Forge's Main does, with SmartAi's extra card logic installed first. */
public final class SmartSim {
    public static void main(String[] args) throws Exception {
        System.setProperty("java.awt.headless", "true");
        System.setProperty("java.util.Arrays.useLegacyMergeSort", "true");
        GuiBase.setInterface(new GuiDesktop());
        SmartAi.install();
        SimulateMatch.simulate(args);
        System.exit(0);
    }

    private SmartSim() {
    }
}
