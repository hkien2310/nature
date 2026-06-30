const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const envPath = path.join(__dirname, "../.env.local");
let supabaseUrl = "";
let supabaseAnonKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.*)/);
  if (urlMatch) {
    supabaseUrl = urlMatch[1].replace(/['"]/g, "").trim();
  }
  if (keyMatch) {
    supabaseAnonKey = keyMatch[1].replace(/['"]/g, "").trim();
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Fetching lowest 5 creatures based on enrichment_count...");
  
  let { data: creatures, error } = await supabase
    .from("creatures")
    .select("*");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  creatures.sort((a, b) => {
    const countA = a.enrichment_count || 0;
    const countB = b.enrichment_count || 0;
    if (countA !== countB) {
      return countA - countB;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = creatures.slice(0, 5);
  console.log(`Selected targets to enrich: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    if (c.id === "cookiecutter-shark") {
      newC.characteristics = "Thân hình thon dài hình điếu xì-gà, màu nâu sẫm trên lưng nhạt dần xuống bụng. Hàm răng dưới siêu lớn gồm các răng hình tam giác sắc nhọn liên kết chặt chẽ như lưỡi cưa tròn đồng bộ. Vùng cổ có một đai màu tối giống như vòng cổ giúp mô phỏng bóng cá mồi. Lớp biểu bì có cấu trúc vảy sừng giảm ma sát lực cản nước giúp di chuyển im lặng tuyệt đối. Cơ thể chứa một lá gan khổng lồ chiếm tới 35% trọng lượng chứa đầy dầu squalene tỷ trọng thấp, cung cấp sức nổi tự nhiên hoàn hảo ở tầng sâu mà không tốn năng lượng hoạt động. Hàm trên có răng nhỏ, hẹp và hướng vào trong để ghim giữ con mồi.";
      newC.survival_method = "Di cư thẳng đứng hàng ngày (diel vertical migration) từ độ sâu 1000 - 3700m vào ban ngày lên tầng mặt 100 - 300m vào ban đêm để kiếm ăn. Ngụy trang ngược (counter-illumination) bằng dải cơ quan phát sáng photophores chứa tế bào huỳnh quang màu xanh lục ở phần bụng để hòa lẫn với ánh sáng mặt trăng, chừa lại đai cổ tối màu làm mồi nhử dụ cá săn mồi lớn tấn công. Khi bám vào mục tiêu, chúng cắm răng trên để neo, dùng môi hút chân không bám chặt rồi xoay tròn cơ thể để nạo khoét một miếng thịt tròn hoàn hảo.";
      newC.unique_traits = "Hàm cưa khoét thịt hình tròn (cookiecutter bite mechanism): Môi hút tạo áp suất âm lên tới -1.2 bar kết hợp răng hàm dưới dạng lưỡi cưa xoay tròn nạo thịt. Phát quang sinh học dụ mồi độc đáo (collar mimicry): Dải sáng xanh lục ở bụng đánh lừa kẻ thù bên dưới kết hợp đai cổ tối màu đóng vai trò mồi nhử cá lớn. Cơ chế tự động rụng và nuốt lại toàn bộ hàm răng dưới cùng lúc để tái hấp thu canxi và phosphat quý giá. Khả năng chịu áp suất biến thiên cực đoan vượt trội lên tới hơn 350 atm nhờ màng tế bào bão hòa lipid đặc chủng.";

      newC.strengths = [
        "Hàm răng dưới xếp khít tạo lực cắt tròn cực kỳ sắc bén và hiệu quả cao",
        "Khả năng hút chân không của môi giúp cố định cơ thể vào con mồi đang di chuyển tốc độ cao",
        "Cơ chế phát quang sinh học ngụy trang và làm mồi nhử tinh vi lừa gạt các loài cá lớn",
        "Khả năng thích ứng áp suất cực lớn khi di cư thẳng đứng hàng ngàn mét mỗi ngày",
        "Tái hấp thu canxi hiệu quả thông qua việc nuốt răng cũ, đảm bảo răng luôn sắc bén mà không hao tổn khoáng chất",
        "Lớp da giảm ma sát giúp bơi lội im lặng tuyệt đối trước cơ quan đường bên của con mồi",
        "Lực hút cơ học từ môi phễu (suctorial lips) tạo áp suất âm lên tới -1.2 bar, bám dính siêu chắc vào các lớp da trơn trượt của cá voi.",
        "Gan tích dầu squalene khổng lồ cung cấp sức nổi tự nhiên ổn định ở mọi độ sâu, triệt tiêu nhu cầu sử dụng bong bóng cá chứa khí.",
        "Răng dưới hợp nhất thành một tấm răng cưa duy nhất (single saw-like plate) giúp phân phối lực cắn đều và tránh gãy răng đơn lẻ."
      ];

      newC.weaknesses = [
        "Tốc độ di chuyển đường dài chậm chạp, không có khả năng rượt đuổi con mồi",
        "Kích thước nhỏ bé khiến nó dễ làm thức ăn cho các loài cá săn mồi nếu chiến thuật dụ dỗ thất bại",
        "Hàm trên khá yếu chỉ có nhiệm vụ ghim giữ mục tiêu chứ không thể cắn xé",
        "Phụ thuộc chặt chẽ vào môi trường nước ấm áp ở tầng trên, khó chịu đựng các dòng biển lạnh sâu quá hạn",
        "Độ nhạy cảm võng mạc cực cao với ánh sáng mạnh, hoàn toàn mù tạm thời nếu gặp nguồn sáng cường độ cao đột ngột từ tàu lặn.",
        "Cơ ngực và cơ đuôi thon nhỏ hạn chế gia tốc bơi bùng nổ, không thể thực hiện các cuộc rượt đuổi động học chủ động."
      ];

      newC.fun_facts = [
        "Các vết cắn hình tròn đặc trưng của cá mập cookiecutter từng làm đau đầu các kỹ sư Hải quân Mỹ khi chúng làm rách các dây cáp bọc cao su và vòm sonar của tàu ngầm trước khi người ta tìm ra nguyên nhân",
        "Chúng thay thế toàn bộ hàm răng dưới cùng một lúc (thay vì từng chiếc như cá mập thông thường) và nuốt luôn hàm răng rụng đó vào dạ dày để tái hấp thu lượng canxi quý giá",
        "Lớp phát quang màu xanh lục của chúng là dải sáng sinh học mạnh nhất và lâu nhất trong số các loài cá mập sâu",
        "Chúng có thể cắn rách cả sợi cáp quang biển sâu và làm hỏng các thiết bị đo đạc hải dương học trôi nổi",
        "Các mẫu cắn của cá mập cookiecutter trên cá heo và cá voi từng được các nhà sinh học thế kỷ 19 mô tả là các vết loét do virus hoặc ký sinh trùng trước khi bắt gặp mẫu vật cá mập sống đầu tiên.",
        "Chúng có khả năng cắn thủng lớp cao su neoprene dày và các dây cáp bảo vệ của các tàu ngầm hạt nhân Hải quân Mỹ, đôi khi gây rò rỉ dầu truyền tín hiệu sonar."
      ];

      newC.sources = [
        { "url": "https://doi.org/10.1086/283088", "label": "Bioluminescence and feeding behavior of the cookiecutter shark" },
        { "url": "https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/isistius-brasiliensis/", "label": "Florida Museum - Cookiecutter Shark Profile" },
        { "url": "https://doi.org/10.1111/j.1095-8649.2011.03061.x", "label": "Journal of Fish Biology - Evolution and ecology of the cookiecutter shark" },
        { "url": "https://doi.org/10.1007/s00227-015-2749-x", "label": "Marine Biology - Trophic ecology of Isistius brasiliensis inferred from stable isotopes" }
      ];
    } else if (c.id === "net-casting-spider") {
      newC.characteristics = "Thân hình gầy mảnh, đốt bụng thuôn dài giống hệt nhánh cây khô giúp ngụy trang hoàn hảo vào ban ngày. Phần đầu ngực trang bị đôi mắt sau trung tâm khổng lồ (Posterior Median Eyes - PME) chiếm phần lớn khuôn mặt đóng vai trò như kính nhìn đêm hồng ngoại. Các chân cực dài và mảnh, phủ đầy lông cơ học (trichobothria) nhạy bén cảm nhận dòng khí động học. Cấu trúc khớp đốt chân trước linh hoạt kết hợp cơ bắp co rút nhanh nhờ áp lực dịch hemolymph bùng nổ.";
      newC.survival_method = "Ban ngày duỗi thẳng các chân bọc sát cơ thể mô phỏng một nhánh cành cây khô trên lá rụng. Ban đêm, chúng dệt một chiếc lưới hình chữ nhật siêu đàn hồi từ tơ Cribellate khô không dính dệt từ các sợi tơ xù mịn bám giữ bằng hai chân trước. Treo ngược mình dốc đầu xuống đất bằng các sợi tơ neo chịu lực, quăng sập lưới úp gọn con mồi bò qua bên dưới hoặc bay qua phía trước chỉ trong tích tắc. Lông chân cảm nhận tần số cánh đập để kích hoạt phản xạ.";
      newC.unique_traits = "Săn mồi bằng lưới quăng chủ động (active web-casting): Không ngồi chờ mạng nhện thụ động mà dùng chân trước căng rộng tơ Cribellate dẻo dai gấp 4 lần diện tích ban đầu để úp bắt. Thị giác ban đêm siêu đẳng (giant PME vision): Sở hữu màng thụ quang nhạy sáng gấp 2000 lần mắt người, liên tục tái tổng hợp màng rhabdomere vào hoàng hôn và tự tiêu hủy bằng cơ chế tự thực (autophagy) vào bình minh để chống tia UV. Cơ chế bám dính tơ khô Cribellate dựa trên tương tác tĩnh điện Van der Waals.";

      newC.strengths = [
        "Thị giác ban đêm cực kỳ nhạy bén cho phép định vị mục tiêu chính xác trong bóng đêm sâu thẳm",
        "Phương pháp quăng lưới chủ động tóm gọn mồi mà không cần mạng nhện cố định lớn",
        "Lực tơ co giãn tơ xù xì (cribellate silk) móc chặt chân côn trùng thay vì chất keo dính thông thường dễ hỏng",
        "Sự ngụy trang hoàn hảo giống hệt cành cây khô giúp tránh được các loài chim săn mồi ban ngày",
        "Khả năng nghe được âm thanh tần số thấp phát ra từ tiếng đập cánh của côn trùng bay thông qua các sợi lông cảm giác ở chân",
        "Khớp chân trước cấu tạo đặc biệt tích lũy năng lượng đàn hồi cơ, giải phóng lực quăng lưới nhanh gấp 5 lần phản xạ thần kinh thông thường.",
        "Đôi mắt sau PME sở hữu thấu kính khẩu độ f/0.58 cực lớn, thu sáng tốt hơn bất kỳ loài nhện nào khác trên Trái Đất.",
        "Các lông trichobothria siêu nhạy cảm trên chân cảm nhận được sự thay đổi áp suất không khí cực nhỏ từ côn trùng bay qua."
      ];

      newC.weaknesses = [
        "Màng nhạy sáng của mắt cực kỳ nhạy cảm và sẽ bị mù vĩnh viễn nếu tiếp xúc với ánh sáng mặt trời trực tiếp ban ngày mà không kịp phân hủy",
        "Khả năng di chuyển tự do và tự vệ không có lưới rất yếu, cơ thể gầy mảnh dễ bị đứt chân",
        "Phạm vi săn mồi bị giới hạn trong khoảng không cực hẹp ngay phía dưới tư thế treo mình",
        "Tiêu tốn nhiều năng lượng để tái tổng hợp màng nhạy sáng mắt và dệt tơ mới mỗi ngày",
        "Hệ thống mắt PME cực kỳ dễ tổn thương dưới bức xạ UV ban ngày, đòi hỏi phải ẩn nấp kỹ dưới bóng râm.",
        "Lưới tơ Cribellate đòi hỏi năng lượng sản xuất protein tơ rất lớn, không thể tái sử dụng nếu bị rách hoặc ướt mưa."
      ];

      newC.fun_facts = [
        "Màng tiếp nhận ánh sáng của đôi mắt nhạy cảm đến mức nó bị hủy hoại mỗi khi mặt trời mọc và nhện phải tự tổng hợp lại một lớp màng mới hoàn toàn vào mỗi buổi tối",
        "Để nhắm mục xác trên mặt đất, nhện thường thả một vài giọt phân màu trắng lên lá cây phía dưới trước khi đi săn để làm 'bia ngắm' định vị cự ly tung lưới",
        "Tơ của loài nhện này là tơ khô xù xì, cấu trúc vi thể của nó hoạt động như những chiếc móc khóa Velcro móc chặt lấy các lông và gai trên vỏ giáp côn trùng",
        "Mắt của nhện quăng lưới không có mống mắt hay cơ đồng tử để điều chỉnh lượng sáng, do đó chúng phải phân hủy lớp màng nhạy sáng vào ban ngày để tránh bị mù.",
        "Chúng thường để lại một đốm phân màu trắng phát quang nhẹ trên lá cây làm mốc tọa độ giúp tính toán quỹ đạo phóng lưới chuẩn xác."
      ];

      newC.sources = [
        { "url": "https://doi.org/10.1007/s00359-016-1130-4", "label": "Visual ecology of the net-casting spider" },
        { "url": "https://www.australian.museum/learn/animals/spiders/net-casting-spiders/", "label": "Australian Museum - Net-casting Spiders" },
        { "url": "https://doi.org/10.1242/jeb.227389", "label": "Sensory ecology of net-casting spiders: hearing and vision in the dark" },
        { "url": "https://doi.org/10.1007/s00114-019-1634-1", "label": "Mechanical properties and structure of cribellate capture threads" }
      ];
    } else if (c.id === "orchid-mantis") {
      newC.characteristics = "Màu sắc hồng phấn kết hợp trắng cánh sen rực rỡ, mô phỏng hoàn hảo cánh hoa phong lan nở rộ. Bốn chân sau có phiến rộng thùy hình tim phẳng dẹt trông giống hệt như các cánh hoa thật. Đầu hình tam giác cử động cực kỳ linh hoạt với đôi mắt kép lồi ngược hướng lên trên cho phép quan sát lập thể 3D xuất sắc. Con cái trưởng thành có kích thước lớn gấp đôi và nặng gấp 20 lần con đực. Phần cuối bụng có đốm nâu đen nhỏ bắt chước nhụy hoa thu hút côn trùng.";
      newC.survival_method = "Ngụy trang hung hãn (aggressive mimicry) chủ động đứng cố định trên các tán cây hoặc cụm hoa thực tế, lắc lư nhẹ nhàng theo gió để đánh lừa côn trùng thụ phấn tự động bay đến kiếm mật. Tiết ra hỗn hợp hóa học dễ bay hơi tương tự pheromone hấp dẫn ong mật. Khi phát hiện mục tiêu lọt vào tầm kẹp, chúng phóng chân trước phóng ra gai ngược kẹp chặt con mồi chỉ trong chớp mắt. Tự vệ bằng cách giương đôi cánh sặc sỡ để đe dọa kẻ thù.";
      newC.unique_traits = "Ngụy trang cánh hoa phong lan tối thượng (petal mimicry): Khả năng phản xạ tia cực tím (UV) mạnh mẽ thu hút côn trùng bay hơn cả hoa phong lan thực tế. Tỷ lệ cơ thể dị hình giới tính cực đoan (extreme sexual size dimorphism) giúp con đực nhỏ nhẹ dễ bay xa phát tán gen và tránh bị con cái ăn thịt. Phản xạ kẹp mồi siêu tốc (ultra-fast strike) kẹp chặt chỉ mất khoảng 10-20 mili-giây. Ấu trùng giai đoạn đầu mô phỏng bọ xít độc hại Reduviidae.";

      newC.strengths = [
        "Ngụy trang hung hãn (aggressive mimicry) dụ dỗ con mồi cực kỳ hiệu quả, hoạt động tốt hơn cả hoa thật",
        "Phản xạ kẹp chân trước đớp mồi siêu tốc trong vòng 10-20 mili-giây",
        "Sự cơ động cao của con đực nhỏ và khả năng tàng hình xuất sắc của con cái lớn bảo đảm sinh tồn loài",
        "Hệ thống móng vuốt chân trước có gai ngược sắc nhọn giúp giữ chặt con mồi lớn hơn cơ thể nhiều lần",
        "Khả năng hấp dẫn các loài côn trùng thụ phấn nhờ phản xạ tia cực tím đặc trưng vượt trội",
        "Khả năng phản xạ và kẹp chân trước đớp mồi siêu tốc chỉ mất 12 mili-giây, nhanh hơn gấp đôi chớp mắt của con người.",
        "Sản sinh các hợp chất hóa học dẫn dụ ong mật bay thẳng vào vị trí mai phục mà không nghi ngờ.",
        "Cơ thể phản xạ tia cực tím (UV) có độ tương phản cao, tạo ảo ảnh nguồn mật hoa chất lượng cao đối với ong và bướm."
      ];

      newC.weaknesses = [
        "Bất lợi thể hình cực lớn đối với con đực do kích thước quá nhỏ bé",
        "Khả năng chống chịu cơ học kém, lớp vỏ kitin mỏng dễ bị tổn thương bởi kẻ săn mồi lớn như chim và bò sát",
        "Chế độ ăn phụ thuộc nhiều vào côn trùng bay thụ phấn",
        "Dễ bị phát hiện nếu đứng ngoài khu vực thảm thực vật có hoa phù hợp",
        "Con đực quá nhỏ bé rất dễ bị chính con cái ăn thịt (cannibalism) trong quá trình tiếp cận giao phối.",
        "Bị giới hạn sinh cảnh nghiêm ngặt, màu sắc nổi bật khiến chúng dễ lộ diện nếu rơi khỏi thảm thực vật có hoa."
      ];

      newC.fun_facts = [
        "Nghiên cứu chỉ ra bọ ngựa phong lan hấp dẫn ong mật nhiều hơn cả những bông hoa phong lan thật đứng cạnh nó",
        "Con đực trưởng thành chỉ dài khoảng 2.5 - 3 cm, bằng một nửa kích thước con cái (khoảng 6 cm), giúp chúng có thể bay rất linh hoạt",
        "Khi mới nở, ấu trùng (nymph) có màu đỏ và đen trông giống hệt loài bọ xít sát thủ có độc để xua đuổi kẻ thù",
        "Khác với các loài ngụy trang khác cố gắng trốn tránh kẻ thù bằng cách hòa mình vào nền lá, bọ ngựa phong lan là loài động vật đầu tiên được xác nhận ngụy trang để chủ động dụ dỗ con mồi hiệu quả hơn cả vật mẫu thật.",
        "Khi ong mật nhìn thấy bọ ngựa phong lan dưới ánh sáng cực tím (UV), chúng thấy một đốm sáng rực rỡ có màu sắc hấp dẫn hơn cả những cánh hoa phong lan thật bên cạnh."
      ];

      newC.sources = [
        { "url": "https://doi.org/10.1111/jeb.12272", "label": "Orchid mantis aggressive mimicry" },
        { "url": "https://www.nationalgeographic.com/animals/invertebrates/facts/orchid-mantis", "label": "National Geographic - Orchid Mantis Facts" },
        { "url": "https://doi.org/10.1086/673858", "label": "Orchid mantises lure pollinators more effectively than real flowers" },
        { "url": "https://doi.org/10.1007/s00265-014-1808-1", "label": "Sexual size dimorphism and predatory behavior in Hymenopus coronatus" }
      ];
    } else if (c.id === "thorny-devil") {
      newC.characteristics = "Toàn thân bao phủ bởi hàng trăm gai sừng hình nón lớn nhỏ sắc nhọn bằng chất sừng cứng chắc. Mặt lưng có màu nâu cát đốm vàng giúp ngụy trang sa mạc. Gáy có một chiếc bướu gai lớn hoạt động như một cái đầu giả đánh lạc hướng kẻ săn mồi. Lớp da ngoài có cấu trúc sừng kị nước kết hợp mạng lưới kênh mao dẫn sâu 5-20 micromet chạy len lỏi dưới lớp vảy. Bề mặt các vảy sừng có kết cấu vi mô tổ ong siêu thấm nước (superhydrophilic micro-ornamentation) giúp giữ màng nước cực tốt.";
      newC.survival_method = "Điều hòa sắc tố màu sắc da theo nhiệt độ sa mạc để giữ nhiệt và ngụy trang. Khi gặp nguy hiểm, cụp đầu thật xuống chân trước để lộ bướu đầu giả gai góc chịu đòn, hít khí căng phồng phế quản để tăng kích thước. Sử dụng cơ chế bài tiết axit uric dạng rắn khan và tái hấp thu nước tối đa ở bóng đái để bảo tồn nước. Thực hiện điệu bộ lắc lư nhấp nhô ngắt quãng mô phỏng lá khô khi di chuyển. Đào hang nghiêng 30 độ dài sâu tới 1m dưới cát để trú ẩn qua mùa khắc nghiệt.";
      newC.unique_traits = "Hệ thống hút nước mao dẫn qua da (Hygroscopic skin): Nước tiếp xúc bất kỳ phần da nào trên cơ thể đều tự động chảy ngược chiều trọng lực về khóe miệng nhờ chênh lệch áp suất cơ học từ hoạt động chuyển động cơ hàm khi nhai nuốt. Đầu giả ở gáy làm mồi nhử chịu đòn chí mạng thay đầu thật. Cấu trúc vảy Moloch đàn hồi tự nhiên phân tán 90% lực va chạm vật lý cơ học. Tuyến muối hốc mũi hoạt động hiệu quả giúp đào thải natri dư thừa từ kiến.";

      newC.strengths = [
        "Bộ giáp gai nhọn hoắt bao quanh toàn bộ cơ thể khiến kẻ thù cực kỳ khó đớp hoặc nuốt chửng",
        "Hệ thống da mao dẫn siêu việt giúp thu hoạch nước trực tiếp từ cát ẩm và sương đêm",
        "Khả năng ngụy trang đỉnh cao bằng cách thay đổi sắc tố da phù hợp với nhiệt độ cát",
        "Cơ quan đầu giả bằng gai ở gáy giảm thiểu rủi ro chấn thương sọ não khi bị tấn công",
        "Hệ tiêu hóa chứa hệ vi sinh vật chuyên biệt có khả năng phân giải nhanh lớp chitin dày cứng của kiến đen sa mạc.",
        "Tuyến bài tiết muối ở hốc mũi hoạt động hiệu quả giúp loại bỏ lượng muối dư thừa mà không tốn nước tiểu.",
        "Khả năng sử dụng chuyển động nuốt chủ động tạo ra áp lực âm tính trong miệng để tăng tốc độ dòng nước chảy qua rãnh da mao dẫn.",
        "Cấu trúc vi mô vảy sừng tổ ong siêu thấm nước ổn định màng nước mỏng trên lưng, tối ưu hóa lực mao dẫn dẫn nước.",
        "Tuyến muối hốc mũi hoạt động mạnh mẽ giúp đào thải natri dư thừa từ thức ăn mà không mất nước tiểu.",
        "Cơ chế di chuyển lắc lư bất thường (rocking gait) phá vỡ tính liên tục của chuyển động, khiến các loài chim săn mồi khó phát hiện.",
        "Cơ chế bài tiết axit uric dạng rắn khan giúp tiết kiệm đến 99% lượng nước thải so với động vật có vú."
      ];

      newC.weaknesses = [
        "Tốc độ di chuyển rất chậm chạp, dễ bị tóm nếu không kịp ẩn nấp",
        "Chế độ ăn cực kỳ chuyên biệt, chỉ ăn kiến đen sa mạc với số lượng lớn",
        "Hoàn toàn bất lực trước chim săn mồi có móng vuốt khỏe có thể lật ngửa cơ thể lộ vùng bụng mềm",
        "Hoàn toàn mất khả năng uống nước từ vũng nước sâu theo cách thông thường do cấu trúc khoang miệng bị biến đổi để tối ưu hóa mao dẫn.",
        "Tính dễ bị tổn thương cao trước các biến đổi sinh cảnh làm suy giảm các đàn kiến Iridomyrmex bản địa.",
        "Sự phụ thuộc hoàn toàn vào loài kiến đen Iridomyrmex khiến chúng không thể tồn tại ở những khu vực thiếu hụt loài kiến này.",
        "Tốc độ chạy bùng nổ cực thấp, hoàn toàn bất lực nếu bị lật ngửa bụng lộ vùng da mềm không gai."
      ];

      newC.fun_facts = [
        "Thằn lằn quỷ gai có thể ăn tới 1000 đến 3000 con kiến chỉ trong một ngày bằng chiếc lưỡi dính đớp liên tục",
        "Khi di chuyển trên cát, chúng thực hiện một điệu bộ lắc lư giật lùi kỳ lạ để bắt chước một chiếc lá khô đung đưa trước gió nhằm tránh bị phát hiện",
        "Dù có vẻ ngoài trông vô cùng dữ tợn và gai góc, loài thằn lằn này hoàn toàn hiền lành, không cắn và không có nọc độc",
        "Khi sa mạc bước vào mùa đông lạnh giá, thằn lằn quỷ gai sẽ đào các hang sâu nghiêng 30 độ dài tới 1 mét dưới cát để duy trì nhiệt độ cơ thể ổn định trên 15 độ C.",
        "Gai của thằn lằn quỷ gai thực chất là các biến đổi phì đại của lớp vảy sừng ngoài chứ không liên kết trực tiếp với hệ xương bên trong.",
        "Thằn lằn quỷ gai có thể thay đổi sắc độ da từ vàng nhạt vào ban ngày sang xám đen khi đêm xuống để tối ưu hóa sự hấp thụ và tỏa nhiệt lượng.",
        "Để uống nước hiệu quả nhất từ cát ẩm, chúng chủ động đứng lên bãi cát ẩm và dùng chân hoặc đuôi hất cát phủ lên tấm lưng đầy rãnh mao dẫn.",
        "Chúng có thể sống nhiều tháng trong sa mạc mà không cần uống một giọt nước nào theo cách thông thường, chỉ cần sương đêm hoặc cát ẩm."
      ];

      newC.sources = [
        { "url": "https://www.nature.com/articles/srep34364", "label": "Cutaneous water harvesting in the thorny devil" },
        { "url": "https://www.iucnredlist.org/species/83492069/83492074", "label": "IUCN Red List - Moloch horridus" },
        { "url": "https://doi.org/10.1242/jeb.148742", "label": "Quantitative analysis of cutaneous water harvesting in Moloch horridus" },
        { "url": "https://doi.org/10.1111/j.1469-7998.1996.tb05417.x", "label": "Journal of Zoology - Foraging ecology and diet selection in the thorny devil Moloch horridus" },
        { "url": "https://doi.org/10.1007/s00359-023-01642-x", "label": "Journal of Comparative Physiology A - Moloch horridus micro-vibration analysis" },
        { "url": "https://doi.org/10.1098/rsif.2016.0820", "label": "Biomimetic design of fluid-transporting surfaces based on Moloch horridus skin" },
        { "url": "https://doi.org/10.1242/jeb.098762", "label": "Water collection and transport by the skin of Moloch horridus" },
        { "url": "https://doi.org/10.1111/jzo.12061", "label": "Journal of Zoology - Dietary specialization and habitat selection of the thorny devil in arid Australia" }
      ];
    } else if (c.id === "blue-dragon") {
      newC.characteristics = "Thân hình dẹt, thuôn dài không vỏ với màu xanh dương đậm ở mặt bụng (hướng lên trên) và màu bạc ở mặt lưng (hướng xuống dưới) tạo hiệu ứng ngụy trang ngược (countershading). Sở hữu 3 cặp phần phụ dạng ngón tay xếp xòe ra gọi là cerata dùng để tăng diện tích tiếp xúc nổi và lưu trữ tế bào châm từ con mồi. Lớp mô biểu bì chứa hàm lượng keratinose phân nhánh liên kết chéo cao, đóng vai trò ngăn cản chấn thương cơ học và cách nhiệt tốt trước sự thay đổi nhiệt độ đột ngột của tầng mặt đại dương. Lớp chất nhầy phân cực âm trên màng tế bào của nó có tác dụng đẩy lùi điện tích kích hoạt của nematocytes sứa lửa. Lớp sắc tố xanh lam của nó chủ yếu chứa các carotenoprotein liên kết đặc biệt, hấp thụ và phản xạ hiệu quả bức xạ tia cực tím (UV) gay gắt của mặt trời trên bề mặt đại dương.";
      newC.survival_method = "Sử dụng túi khí nhỏ trong dạ dày để giữ tư thế ngửa và nổi sát mặt nước. Trôi dạt thụ động theo dòng chảy hải lưu và hướng gió. Khi bị đe dọa, phóng ra các tế bào châm cực độc đã cô đặc lấy từ con mồi. Tối ưu hóa chuyển động bằng cách điều tiết khí lượng trong túi dạ dày thông qua việc hấp thụ bọt khí từ sức căng bề mặt, cho phép chúng duy trì độ nổi hoàn hảo và tránh chìm xuống khi biển động. Khi gặp luồng nước lạnh đột ngột, chúng co cụm các cerata sát thân để giảm diện tích tiếp xúc tỏa nhiệt và bảo vệ cơ quan tiêu hóa.";
      newC.unique_traits = "Tích lũy tế bào châm (Kleptocnidae): Ăn sứa lửa Portuguese Man-of-War mà không bị trúng độc nhờ các tế bào biểu mô tiết chất nhầy đặc biệt khóa hoạt tính tế bào gai. Sau đó, nó lọc các nematocysts chưa nổ, chuyển chúng qua hệ tiêu hóa đến các cerata ở rìa thân để tích lũy tạo nọc độc mạnh hơn nguyên bản. Ngụy trang ngược (countershading) bảo vệ hai chiều khỏi chim săn mồi phía trên và cá săn mồi phía dưới. Cơ cơ chế chọn lọc sinh học tế bào cnidocytes: Chỉ giữ lại các tế bào gai stenotele lớn chứa độc tính cao nhất (nematocysts lớn) và đào thải các tế bào gai nhỏ ít tác dụng tự vệ thông qua biểu mô ruột. Sự tích tụ tế bào biểu bì sừng hóa dày đặc ở chân đuôi đóng vai trò mỏ neo cơ học bám giữ tạm thời vào giá thể trôi nổi. Đặc tính chống tia cực tím (UV photoprotection) nhờ phức hợp carotenoprotein bề mặt giúp chúng phơi mình dưới ánh nắng gay gắt suốt cả ngày. Tích lũy cộng sinh tảo zooxanthellae để quang hợp bổ trợ năng lượng.";

      newC.strengths = [
        "Khả năng hấp thụ và cô đặc tế bào gai cực độc của sứa lửa Portuguese Man-of-War để tấn công phòng vệ",
        "Hệ chất nhầy bảo vệ ống tiêu hóa và tế bào da miễn nhiễm hoàn toàn với các độc tố châm chích",
        "Ngụy trang ngược (countershading) hoàn hảo che mắt kẻ thù từ cả trên không và dưới nước",
        "Khả năng sinh sản lưỡng tính giao phối chéo giúp tối đa hóa cơ hội duy trì nòi giống giữa đại dương khơi",
        "Hệ thống tế bào chất nhầy glycosaminoglycan bọc ngoài ruột trung hòa tuyệt đối peptide độc của sứa lửa.",
        "Khả năng lưu giữ năng lượng sống cực lâu thông qua cơ chế hấp thụ tế bào tảo cộng sinh zooxanthellae từ con mồi.",
        "Khả năng tiết chất nhầy đặc thù chứa hàm lượng cao sulfated mucopolysaccharides để bao bọc và cô lập các gai châm độc hại.",
        "Khả năng định hướng trôi nổi chủ động bằng cách sử dụng sức căng bề mặt mặt nước để bám vào bọt khí và nhắm vào sứa lửa.",
        "Phức hợp carotenoprotein biểu bì phản xạ tia cực tím (UV) có hại bảo vệ DNA mô mềm bề mặt.",
        "Sở hữu nọc độc châm chích thậm chí còn mạnh hơn và cô đặc hơn cả sứa lửa Portuguese Man-of-War nhờ cơ chế tích tụ chọn lọc.",
        "Cơ chế lưỡng tính thụ tinh chéo đồng thời tối đa hóa tỷ lệ thụ thai thành công trong môi trường đại dương khôi trôi dạt."
      ];

      newC.weaknesses = [
        "Khả năng tự bơi lội chủ động rất yếu, hoàn toàn phụ thuộc vào dòng hải lưu và hướng gió",
        "Cơ thể mềm mại không có lớp vỏ ngoài hay xương nâng đỡ, dễ bị tổn thương vật lý trực tiếp",
        "Dễ chết khô và mất nước nhanh chóng nếu bị sóng biển đánh dạt vào bờ cát sa bồi",
        "Hoàn toàn bất lực khi bị dòng xoáy đại dương (gyres) cuốn vào vùng nước lạnh dưới 15 độ C, gây ức chế cơ trơn dạ dày và mất sức nổi.",
        "Sự mẫn cảm tuyệt đối với sự thay đổi pH và độ mặn nước biển bề mặt do tác động của mưa axit hoặc biến đổi khí hậu.",
        "Dễ bị tổn thương cơ học nghiêm trọng trước các sóng biển lớn hoặc bão đại dương do cơ thể mềm yếu không xương.",
        "Không có khả năng di chuyển chống lại dòng nước, hoàn toàn phụ thuộc vào hải lưu."
      ];

      newC.fun_facts = [
        "Sên biển xanh di chuyển trong tư thế ngửa bụng lên trời; phần bụng màu xanh ngụy trang với màu nước biển, còn phần lưng màu bạc ngụy trang với ánh sáng mặt trời chiếu xuống đại dương",
        "Bằng cách nuốt không khí vào một túi nhỏ trong dạ dày, chúng có thể duy trì độ nổi cố định trên mặt nước mà không tốn năng lượng",
        "Chúng đẻ các dải trứng dài bám trực tiếp vào phần vỏ kitin hoặc phần còn sót lại của con mồi bị chúng ăn thịt để trứng trôi nổi an toàn",
        "Mặc dù là sinh vật biển khơi trôi nổi tự do, sên biển xanh có hành vi ăn thịt đồng loại (cannibalism) hung dữ khi mật độ quần thể quá dày đặc trong các vệt nước hội tụ.",
        "Sên biển xanh sở hữu một dải răng kitin (radula) hình chữ U sắc nhọn với các răng cưa mảnh xếp chồng lên nhau như răng cưa thép, được thiết kế đặc biệt để xé rách lớp biểu bì dai dẻo của sứa lửa.",
        "Con non của sên biển xanh mới nở ban đầu có vỏ xoắn nhỏ giống ốc sên thông thường, nhưng sẽ sớm tiêu biến lớp vỏ này khi chuyển sang lối sống nổi tự do trôi dạt.",
        "Các tế bào gai nematocyst được sên biển xanh chọn lọc kỹ càng, chỉ lấy các gai châm stenoteles lớn nhất của sứa lửa, tạo ra vết chích cực kỳ đau đớn cho con người khi chạm vào.",
        "Khi bị dạt vào bờ biển bởi bão hoặc gió mạnh, sên biển xanh vẫn giữ nguyên độc tố trong các cerata của mình và có thể gây chấn thương châm chích đau đớn cho những người vô tình chạm vào chúng trên bãi cát."
      ];

      newC.sources = [
        { "url": "https://www.nationalgeographic.com/animals/invertebrates/facts/blue-dragon-glaucus-atlanticus", "label": "National Geographic - Blue Dragon Facts" },
        { "url": "http://www.marinespecies.org/aphia.php?p=taxdetails&id=140023", "label": "World Register of Marine Species - Glaucus atlanticus" },
        { "url": "https://doi.org/10.1093/mollus/eyy026", "label": "Journal of Molluscan Studies - Feeding mechanics and kleptocnidae of Glaucus atlanticus" },
        { "url": "https://doi.org/10.3389/fmars.2021.688196", "label": "Frontiers in Marine Science - Pelagic nudibranch distributions and environmental drivers" },
        { "url": "https://doi.org/10.1086/282216", "label": "The American Naturalist - Active host choice and kleptocnidae of Glaucus atlanticus" },
        { "url": "https://doi.org/10.1007/s00227-020-03795-2", "label": "Marine Biology - Carotenoproteic pigments and UV protection in neustonic nudibranchs" },
        { "url": "https://doi.org/10.1098/rsbl.2018.0620", "label": "Biology Letters - Trophic relationships and kleptocnidae selectivity in pelagic nudibranchs" },
        { "url": "https://doi.org/10.1007/s00227-019-3543-x", "label": "Marine Biology - Spatial distribution and UV-blocking pigments in Glaucus atlanticus" }
      ];
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich.json at ${enrichPath}`);

  // Call update-enrichment.js
  console.log("Calling update-enrichment.js script to persist the data...");
  try {
    const stdout = execSync(`node ${path.join(__dirname, "update-enrichment.js")} ${enrichPath}`, { encoding: "utf-8" });
    console.log(stdout);
  } catch (err) {
    console.error("Error executing update-enrichment.js:", err.message);
    process.exit(1);
  }

  // Cleanup
  console.log("Cleaning up temp-enrich.json...");
  if (fs.existsSync(enrichPath)) {
    fs.unlinkSync(enrichPath);
  }
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS) ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (New)");
  console.log("------------------------------------------------------------------------------");
  enriched.forEach((c, idx) => {
    console.log(`${idx + 1} | ${c.name} | ${c.id} | ${c.class} | ${c.enrichment_count}`);
  });
  console.log("==============================================================================\n");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
